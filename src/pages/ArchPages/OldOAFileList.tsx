import React, { useEffect, useState } from "react";
import { attachmentsClient, useUser } from "../../hooks/useApi";
import { useQueryStringParser } from "../../hooks/useQueryStringParser";
import { openFileByWps } from "../../hooks/wps";
import { FormAttachmentDto, IFormAttachmentDto } from "../../WorkFlowApi";
import "antd/dist/antd.css";
import { Alert, Button, List, message, notification, Spin, Tag } from "antd";
import { workFlowBaseUrl } from "../../Commmon/consts";

export default () => {
    const query = useQueryStringParser()
    const businessKey = query.get('businessKey')
    const taskId = query.get('taskId')
    const isOldOAArchMonitor = query.get('isOldOAArchMonitor')

    const [files, setfiles] = useState<FormAttachmentDto[]>([])
    const [err, setError] = useState('')
    useEffect(() => {
        setError('')
        attachmentsClient.getFormAttachments(businessKey ?? '', taskId ?? '', isOldOAArchMonitor === "1", false).then(res => {
            setfiles(res)
        }).catch(err => {
            setError(JSON.stringify(err))
        })
    }, [businessKey, taskId, isOldOAArchMonitor])

    const { userDisplayName, userName } = useUser()


    /**
   * 
   * @param item 下载附件
   */
    const downloadAttachment = (item: IFormAttachmentDto) => {
        window.open(item.downloadUrl)
    }

    /**
     * 是否用wps打开
     * @param e 
     */
    const canOpenByWps = (e: IFormAttachmentDto) => {
        return (e.orignFileName.endsWith('.doc') || e.orignFileName.endsWith('.docx') || e.orignFileName.endsWith('.wps'))
    }

    const openByPDF = (e: IFormAttachmentDto) => {
        window.open(`${workFlowBaseUrl}/spa/pdfjs/web/viewer.html?file=${e.downloadUrl}`)
    }

    const [loadingWps, setLodingWps] = useState<boolean>(false);
    const [, setTime] = useState<number>(0);



    const openByWPS = async (e: IFormAttachmentDto) => {
        if (canOpenByWps(e)) {
            setTime(0)
            setLodingWps(true)

            //const url = await attachmentsClient.getAttachmentNewestUploadAndDownloadUrl(e.downloadUrl)

            const canEdit = await attachmentsClient.oldOACanEditFile(taskId ?? '')
            await openFileByWps({
                userName: (userDisplayName ?? userName) ?? '',
                access_token: '',
                downloadUrl: e.downloadUrl ?? '',
                uploadUrl: e.uploadUrl ?? '',
                readonly: canEdit === false
            })

            notification.success({ message: '打开wps成功' })
            setLodingWps(false)
        } else {
            if (e.orignFileName.toLowerCase().endsWith('.pdf')) {
                openByPDF(e)
            } else {
                downloadAttachment(e)
            }
        }
    }



    const RenderAttachmentItem = (item: IFormAttachmentDto, index: number) => {
        return <p style={{ color: '#0000ee', fontSize: 16 }}>
            <span onClick={() => openByWPS(item)} style={{ cursor: 'pointer' }}>{item.tag === null ? <></> : <Tag>{item.tag}</Tag>}{item.orignFileName} （{item.humanizeBytesLength}）</span>
            <Button onClick={() => downloadAttachment(item)} size="small" className="ml-2">下载</Button>
            {canOpenByWps(item) ? <Button className="ml-2" onClick={() => openByWPS(item)} size="small">直接打开</Button> : <></>}
            {item.orignFileName.endsWith(".pdf") ? <Button className="ml-2" onClick={() => openByPDF(item)} size="small">直接打开</Button> : <></>}
        </p>
    }

    return <div>
        {loadingWps ? <Spin spinning={loadingWps}>正在打开WPS，请稍等 </Spin> : <></>}

        {err.length > 0 && <Alert message={err} type="error" />}
        <div className='form-group'>
            <List
                size="small"
                //header={<div>Header</div>}
                //footer={<div>Footer</div>}
                locale={{ emptyText: <></> }}
                dataSource={files}
                renderItem={RenderAttachmentItem}
            />
        </div>
    </div>
}

