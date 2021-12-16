import { notification } from 'antd';
import { Base64 } from 'js-base64';
import 'wps-jsapi'
import axios from 'axios'
import { IFormAttachmentDto, FormAttachmentDto, AttachmentsClient } from '../WorkFlowApi'


export const openFile = (info: Info) => {
    console.log('openFile', info)

    wps.WpsApplication().UserName = info.userName;

    wps.WpsApplication().WindowState = 1
    wps.WpsApplication().Activate();

    //wps.WpsApplication().Documents.Open(info.downloadUrl,null,true)
    //url  config   readOnly
    //alert(downloadUrl);
    (wps.WpsApplication().Documents as any).OpenFromUrl(info.downloadUrl, 'openFileSuccess', 'openFileFailed')

    let doc = wps.WpsApplication().ActiveDocument

    wps.PluginStorage.setItem(doc.DocID.toString(), JSON.stringify(info))

    if (info.readonly === false) {
        //打开修订
        openRevision(doc, true, false)
    } else {
        doc.Protect(3/* Wps.WpsWdProtectionType.wdAllowOnlyReading */)
        openRevision(doc, false, false)
        doc.Saved = true
    }

    /*wps.ApiEvent.AddApiEventListener('DocumentBeforeSave', (doc) => {
        let document  = doc as Wps.WpsDocument
        console.log(document)
        saveFileToServer(document)
        wps.ApiEvent.Cancel = true;
    })*/


    let count = 0;
    let timer = setInterval(() => {
        window.ribbonUI?.ActivateTab("wpsAddinTab")
        window.ribbonUI?.Invalidate()
        count++
        if (count >= 20) {
            clearInterval(timer)
        }
    }, 500)
}


export const openFileSuccess = () => {
    console.log('打开成功')
    /*   let doc = wps.WpsApplication().ActiveDocument
      let json = wps.PluginStorage.getItem("temp_" + doc.DocID.toString())
      wps.PluginStorage.setItem(doc.DocID.toString(), json) */
}


export function openFileFailed() {
    let doc = wps.WpsApplication().ActiveDocument
    wps.PluginStorage.removeItem(doc.DocID.toString())
    doc.Saved = true
    alert('打开附件失败')
    doc.Close()
}
/**
 * 保存为本地
 * @param doc 
 */
export const saveAsLocalFile = (doc: Wps.WpsDocument) => {
    wps.PluginStorage.setItem(doc.DocID.toString() + '_enableUpload', "false")
    doc.AcceptAllRevisions()
    doc.RemoveDocumentInformation(1)//Wps.WpsWdRemoveDocInfoType.wdRDIComments
    openRevision(doc, false, false)
    doc.Save()
}

export const saveToDesktop = (doc: Wps.WpsDocument) => {
    var date = new Date();

    var dir = wps.Env.GetHomePath() + '/Desktop/wps文件/'
    wps.FileSystem.Mkdir(dir)
    dir = dir + date.getFullYear() + '-' + date.getMonth() + '-' + date.getDay()
    wps.FileSystem.Mkdir(dir);

    var info = JSON.parse(wps.PluginStorage.getItem(doc.DocID.toString())) as Info
    //var fileName = dir + '/[OA]' + (info.attachment as IFormAttachmentDto).orignFileName;

    //doc.SaveAs(fileName)
    //(wps.FileSystem as any).writeAsBinaryString(fileName, doc.WordOpenXML)
    wps.OAAssist.ShellExecute(dir, '')
}

/**
 * 保存到服务器
 * @param doc 
 */
export const saveFileToServer = (doc: Wps.WpsDocument) => {
    if (doc.Saved) {
        return
    }

    let info = JSON.parse(wps.PluginStorage.getItem(doc.DocID.toString())) as Info
    if (info.readonly) {
        alert('只读文档，不能上传到服务器')
        return
    }
    var enabled = wps.PluginStorage.getItem(doc.DocID.toString() + '_enableUpload')
    if (enabled === 'false') {
        alert('保存到了本地就不能再上传到服务器')
        return;
    }


    console.log(info, doc, (doc as any).SaveAsUrl);

    (doc as any).SaveAsUrl(doc.Name, info.uploadUrl, "11", 'onUploadFileSuccess', 'onUploadFileFailed');
}


export const onUploadFileSuccess = (res: any) => {
    const newuploadUrl = Base64.decode((JSON.parse(res).Body) as string);
    var doc = wps.WpsApplication().ActiveDocument

    let info = JSON.parse(wps.PluginStorage.getItem(doc.DocID.toString())) as Info
    info.uploadUrl = newuploadUrl
    wps.PluginStorage.setItem(doc.DocID.toString(), JSON.stringify(info))

    doc.Saved = true
}

export const onUploadFileFailed = (res: any) => {
    const err = Base64.decode((JSON.parse(res).Body) as string);
    alert('上传失败' + err)
}

/**
 * 打开修订
 * @param doc 
 * @param bOpenRevision 是否打开修订
 * @param bShowRevision 显示痕迹
 */
export const openRevision = (doc: Wps.WpsDocument, bOpenRevision: boolean, bShowRevision: boolean) => {
    doc.TrackRevisions = bOpenRevision; //如果标记对指定文档的修改，则该属性值为True
    var l_v = doc.ActiveWindow.View;
    l_v.ShowRevisionsAndComments = bShowRevision; //如果为True，则 WPS 显示使用“修订”功能对文档所作的修订和批注
    l_v.RevisionsBalloonShowConnectingLines = bShowRevision; //如果为 True，则 WPS 显示从文本到修订和批注气球之间的连接线
    wps.WpsApplication().CommandBars.ExecuteMso("KsoEx_RevisionCommentModify_Disable"); //去掉修改痕迹信息框中的接受修订和拒绝修订勾叉，使其不可用


    if (bShowRevision) {
        doc.ActiveWindow.ActivePane.View.RevisionsMode = 2; //2为不支持气泡显示。
    }
}


export function btnExportAsPDF(doc: Wps.WpsDocument) {
    doc.ExportAsFixedFormat(doc.Name, 17/* Wps.WpsWdExportFormat.wdExportFormatPDF */)
}