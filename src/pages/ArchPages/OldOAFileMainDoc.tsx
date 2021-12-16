import React, { useEffect, useState } from "react";
import { workFlowBaseUrl } from "../../Commmon/consts";
import { attachmentsClient, useUser } from "../../hooks/useApi";
import { useQueryStringParser } from "../../hooks/useQueryStringParser";
import { openFileByWps } from "../../hooks/wps";
import { FormAttachmentDto, IFormAttachmentDto } from "../../WorkFlowApi";

export default () => {
    const query = useQueryStringParser()
    const taskId = query.get('taskId')

    const [err, setError] = useState('')
    useEffect(() => {
        setError('')
        attachmentsClient.getFormAttachments('', taskId ?? '', false, false).then(res => {
            var mainDocs = res.filter(e => e.orignFileName === "正文.doc")
            if (mainDocs.length === 1) {
                openByWPS(mainDocs[0])
            } else {
                setError('不存在正文')
            }
        }).catch(err => {
            setError(JSON.stringify(err))
        })
    }, [taskId])


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

    const { userDisplayName, userName } = useUser()

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

            setLodingWps(false)
            window.close()
        } else {
            if (e.orignFileName.toLowerCase().endsWith('.pdf')) {
                openByPDF(e)
            } else {
                downloadAttachment(e)
            }
        }
    }


    return <div>
        {loadingWps ? <span>正在打开WPS，请稍等 </span> : <></>}

        {err.length > 0 && <label style={{ color: 'red' }}>{err}</label>}
    </div>
}

