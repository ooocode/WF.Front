import { useCallback, useContext, useRef, useState } from "react"
import { Upload, message, Table, Button, Space, Progress } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { ColumnsType } from "antd/lib/table";
import { FormContext } from "../hooks/useTask";
import { attachmentsClient, useUser } from "../hooks/useApi";
import { IFormAttachmentDto } from "../WorkFlowApi";
import { openFileByWps } from "../hooks/wps";
import { messageBox, notificationError } from "../messageBox";
import MyDialog from "./MyDialog";
import { workFlowBaseUrl } from "../Commmon/consts";
import React from 'react'
import { useFormQueryString } from "../hooks/useFormQueryString";
import { useDropzone } from "react-dropzone";
import axios, { Canceler } from 'axios'
const { Dragger } = Upload;

interface FormAttachmentsProps {
    ModalVisualState: {
        value: boolean
        Toggle: () => void
    }
    tag?: string
}

type UploadProgressParams = {
    loaded: number
    total: number
    fileName: string
}

const CancelToken = axios.CancelToken;

export const FormAttachments = (props: FormAttachmentsProps) => {
    const formContext = useContext(FormContext)
    const { bearer_access_token, userDisplayName } = useUser()
    const { mode } = useFormQueryString()
    const [uploadProgress, setUploadProgress] = useState<UploadProgressParams>()
    const cancel = useRef<Canceler>()

    const thisFileProps = {
        name: 'file',
        multiple: true,
        action: `${workFlowBaseUrl}/api/FormAttachments?businessKey=${formContext?.task?.value?.form?.businessKey}&tag=${props.tag ?? ''}`,
        headers: {
            //Authorization: 'Bearer ' + formContext?.user?.access_token
            Authorization: bearer_access_token
        },
        onChange(info: any) {
            const { status } = info.file;
            if (status !== 'uploading') {
                console.log(info.file, info.fileList);
            }
            if (status === 'done') {
                message.success(`${info.file.name} 上传成功`);
                formContext?.reloadAttachments.Toggle()
            } else if (status === 'error') {
                console.log(info)
                message.error(`${info.file.name} 上传失败`);
            }
        },
    };


    const onDrop = async (acceptedFiles: any) => {
        setUploadProgress(undefined)
        try {
            var data = new FormData()
            data.append('file', acceptedFiles[0])
            const url = `${workFlowBaseUrl}/api/FormAttachments?businessKey=${formContext?.task?.value?.form?.businessKey}&tag=${props.tag ?? ''}`
            const res = await axios.post(url, data, {
                headers: {
                    Authorization: bearer_access_token
                },
                onUploadProgress: (e) => {
                    console.log(e)
                    setUploadProgress({ total: e.total, loaded: e.loaded, fileName: acceptedFiles[0].name })
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                cancelToken: new CancelToken(function executor(c) {
                    cancel.current = c;
                }),
            })
            message.success('成功上传附件：' + acceptedFiles[0].name)
            formContext?.reloadAttachments.Toggle()
        } catch (error) {
            notificationError('上传文件失败', error)
        }
        setUploadProgress(undefined)
    }

    /**
     * 删除附件
     * @param attachment 
     */
    const deleteAttachment = (attachment: IFormAttachmentDto) => {
        attachmentsClient.deleteArchAttachment(attachment.stringId ?? '').then(() => {
            messageBox(`删除附件${attachment.orignFileName}成功`)
            formContext?.reloadAttachments.Toggle()
        }).catch(err => {
            messageBox(err)
        })
    }

    /**
     * 下载附件
     * @param item 
     */
    const downloadAttachment = (item: IFormAttachmentDto) => {
        window.open(item.downloadUrl + "?showRevision=true")
    }


    const updateOrder = (item: IFormAttachmentDto, order: number) => {
        attachmentsClient.updateAttachmentOrder(item.stringId ?? '', order).then(res => {
            formContext?.reloadAttachments.Toggle()
        }).catch(err => messageBox(err))
    }

    /**
  * 是否用wps打开
  * @param e 
  */
    const canOpenByWps = (e: IFormAttachmentDto) => {
        return (e.orignFileName.endsWith('.doc') || e.orignFileName.endsWith('.docx') || e.orignFileName.endsWith('.wps')) && mode === 'todo'
    }

    const openByWPS = async (e: IFormAttachmentDto) => {
        const url = await attachmentsClient.getAttachmentNewestUploadAndDownloadUrl(e.downloadUrl)
        await openFileByWps({
            userName: userDisplayName ?? '',
            access_token: bearer_access_token ?? '',
            downloadUrl: url.downloadUrl ?? '',
            uploadUrl: url.uploadUrl ?? '',
            readonly: (formContext?.task?.value?.canUploadOrUpdateFiles ?? false) === false
        })
    }

    const cols: ColumnsType<IFormAttachmentDto> = [
        {
            title: "文件名称",
            render: (e: IFormAttachmentDto) => <>{e.orignFileName} （{e.humanizeBytesLength}）</>
        },
        {
            title: "操作",
            render: (e: IFormAttachmentDto) => <Space size="small">
                <Button size="small" onClick={() => downloadAttachment(e)}>下载</Button>
                {canOpenByWps(e) ? <Button onClick={() => openByWPS(e)} size="small">WPS打开</Button> : <></>}
                {(formContext?.task?.value?.canUploadOrUpdateFiles === true) && e.notAllowedDelete !== true ? <Button onClick={() => deleteAttachment(e)} size="small" danger>删除</Button> : <></>}
            </Space>
        },
        /*  {
             title: "排序",
             render: (e: IFormAttachmentDto) => <Space size="small">
                 <Tooltip title="修改排序">
                     <Input type='number'
                         value={e.order}
                         style={{ width: 60 }}
                         onPressEnter={(ee) => updateOrder(e, parseInt(ee.target.))}></Input>
                 </Tooltip>
             </Space>
         } */
    ]

    /*const isOnlyShowNullTagAttachments = () => {
        var onlyShowNullTagAttachments = false
        if (formContext?.prodefKey === 'FWGL') {
            if (formContext?.task.value?.activityName === '各单位收文' || formContext?.task.value?.activityName == '相关人员阅') {
                onlyShowNullTagAttachments = true
            }
        }
        return onlyShowNullTagAttachments;
    }*/

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    const cancelUpload = () => {
        if (cancel.current) {
            cancel.current()
            message.info('取消文件上传')
        }
    }

    return <div>
        <MyDialog
            open={props.ModalVisualState.value}
            title={`${props.tag ? props.tag : '附件列表'}（${formContext?.attachments.value?.filter(e => e.tag === (props.tag ?? null))?.length ?? 0}）`}
            onClose={() => props.ModalVisualState.Toggle()}>
            {/*  {formContext?.task?.value?.canUploadOrUpdateFiles === true && <><Dragger
                {...thisFileProps}
                showUploadList={false}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或者拖拽文件到此区域</p>
                <p className="ant-upload-hint">
                </p>
            </Dragger></>} */}


            {formContext?.task?.value?.canUploadOrUpdateFiles === true && uploadProgress === undefined && <> <div {...getRootProps()}
                style={{ border: '1px dashed skyblue ', textAlign: 'center' }}>
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p style={{ marginTop: 30 }}>拖拽文件到此区域</p> :
                        <p style={{ marginTop: 30 }}>点击或者拖拽文件到此区域</p>
                }
            </div></>}


            {uploadProgress && <>
                <Progress
                    percent={parseInt((uploadProgress.loaded / uploadProgress.total * 100).toString())} />
                <Button onClick={cancelUpload} danger size='small'>取消上传</Button>
                <p>{uploadProgress.fileName}</p>
            </>}

            <Table
                dataSource={formContext?.attachments?.value?.filter(e => e.tag === (props.tag ?? null))} columns={cols}
                loading={formContext?.attachments.loading}
                rowKey={(e) => e.stringId ?? ''}
                scroll={{ y: 300 }}
                showHeader={false}
                pagination={false} />
        </MyDialog>
    </div>
}