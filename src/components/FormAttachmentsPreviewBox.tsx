import React, { useContext, useState } from "react"
import { Button, Spin, message, List, Tag, notification } from 'antd';
import Dragger from "antd/lib/upload/Dragger";
import { InboxOutlined } from "@ant-design/icons";
import { FormContext } from "../hooks/useTask";
import { attachmentsClient, axiosClient, useUser } from "../hooks/useApi";
import { openFileByWps } from "../hooks/wps";
import { messageBox } from "../messageBox";
import { IFormAttachmentDto } from "../WorkFlowApi";
import { workFlowBaseUrl } from "../Commmon/consts";
import { useFormQueryString } from "../hooks/useFormQueryString";
import axios from "axios";
import { withPrefix } from "gatsby-link";
interface FormAttachmentsPreviewBoxProps {
    hideEditStatus?: boolean
}

export const FormAttachmentsPreviewBox = (props: FormAttachmentsPreviewBoxProps) => {
    const formContext = useContext(FormContext)

    /**
     * 
     * @param item 下载附件
     */
    const downloadAttachment = (item: IFormAttachmentDto) => {
        window.open(item.downloadUrl + "?showRevision=true")
    }



    const openByPDF = (e: IFormAttachmentDto) => {
        if (e.downloadUrl) {
            /* var newTab = window.open('about:blank');
 
             var res = await axios({
                 method: 'GET',
                 url: e.downloadUrl,
                 responseType: 'blob',
                 onDownloadProgress: (e) => {
                     console.log(e)
                 }
             })
 
             var blob = new Blob([res.data], {
                 type: 'application/pdf;chartset=UTF-8'
             })
             let fileURL = URL.createObjectURL(blob)
 
             if (newTab) {
                 newTab.location.href = (fileURL)
             }*/

            //window.open(fileURL)
            //window.open(withPrefix(`/CommonPages/PdfViewer?url=${e.downloadUrl}`))
            window.open(`${workFlowBaseUrl}/spa/pdfjs/web/viewer.html?file=${e.downloadUrl}`)
        }


        //window.open(`${workFlowBaseUrl}/spa/pdfjs/web/viewer.html?file=${e.downloadUrl}`)
    }

    const [loadingWps, setLodingWps] = useState<boolean>(false);
    const [, setTime] = useState<number>(0);

    const { userDisplayName, bearer_access_token } = useUser()
    const { mode } = useFormQueryString()

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
    * 是否用wps打开
    * @param e 
    */
    const canOpenByWps = (e: IFormAttachmentDto) => {
        return (e.orignFileName.endsWith('.doc') || e.orignFileName.endsWith('.docx') || e.orignFileName.endsWith('.wps')) /* && formContext?.mode === 'todo' */
    }

    const openByWPS = async (e: IFormAttachmentDto) => {
        if (canOpenByWps(e)) {
            setTime(0)
            setLodingWps(true)

            const url = await attachmentsClient.getAttachmentNewestUploadAndDownloadUrl(e.downloadUrl)

            await openFileByWps({
                userName: userDisplayName ?? '',
                access_token: userDisplayName ?? '',
                downloadUrl: url.downloadUrl ?? '',
                uploadUrl: url.uploadUrl ?? '',
                readonly: (formContext?.task?.value?.canUploadOrUpdateFiles ?? false) === false || mode !== 'todo'
            })

            //notification.success({ message: '打开wps成功' })
            setLodingWps(false)
        } else {
            //downloadAttachment(e)
            if (e.orignFileName.toLowerCase().endsWith('.pdf')) {
                openByPDF(e)
            } else {
                downloadAttachment(e)
            }
        }
    }

    const thisFileProps = {
        name: 'file',
        multiple: true,
        action: workFlowBaseUrl + "/api/FormAttachments?businessKey=" + formContext?.task?.value?.form?.businessKey,
        headers: {
            //Authorization: 'Bearer ' + formContext?.user?.access_token
            Authorization: bearer_access_token ?? ''
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
                message.error(`${info.file.name} 上传失败`);
            }
        },
    };

    const RenderAttachmentItem = (item: IFormAttachmentDto, index: number) => {
        return <p style={{ color: '#0000ee', fontSize: 16 }}>
            <span onClick={() => openByWPS(item)} style={{ cursor: 'pointer' }}>{item.tag === null ? <></> : <Tag>{item.tag}</Tag>}{item.orignFileName} （{item.humanizeBytesLength}）</span>
            {/* <Button onClick={() => downloadAttachment(item)} size="small" className="ml-2">下载</Button>
            {canOpenByWps(item) ? <Button className="ml-2" onClick={() => openByWPS(item)} size="small">直接打开</Button> : <></>}
            {item.orignFileName.endsWith(".pdf") ? <Button className="ml-2" onClick={() => openByPDF(item)} size="small">直接打开</Button> : <></>} */}
            {(formContext?.task?.value?.canUploadOrUpdateFiles === true && (props.hideEditStatus ?? false) === false) && (item.notAllowedDelete !== true) ? <Button danger onClick={() => deleteAttachment(item)} size="small" className="ml-2">删除</Button> : <></>}
        </p>
    }

    return <div>
        {loadingWps ? <Spin spinning={loadingWps}>正在打开WPS，请稍等 </Spin> : <></>}
        <div className='form-group'>
            {(formContext?.task?.value?.canUploadOrUpdateFiles === true && (props.hideEditStatus ?? false) === false) ? <Dragger
                {...thisFileProps}
                showUploadList={false}>
                <div>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或者拖拽文件到此区域</p>
                    <p className="ant-upload-hint">
                    </p>
                </div>
            </Dragger> : <></>}

            <List
                size="small"
                //header={<div>Header</div>}
                //footer={<div>Footer</div>}
                style={{ marginTop: formContext?.task?.value?.canUploadOrUpdateFiles === true ? 20 : 0 }}
                locale={{ emptyText: <></> }}
                dataSource={formContext?.attachments.value}
                loading={formContext?.attachments.loading}
                renderItem={RenderAttachmentItem}
            />
        </div>
    </div>
}