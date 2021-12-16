import {
    openRevision, saveAsLocalFile, saveToDesktop, btnExportAsPDF,
    saveFileToServer, openFile, onUploadFileSuccess, onUploadFileFailed,
    openFileFailed,
    openFileSuccess
} from "./src/Interfaces/documentMethods";
import { enableMapSet } from 'immer'

enableMapSet()

function initFuncs() {
    /*window.OnTabEnabled = () => {
        alert('qqqqqqq')
        return false
    }*/

    window.dispatch = (info) => {
        openFile(info)
    }

    window.openFileSuccess = () => {
        openFileSuccess()
    }

    window.openFileFailed = (res) => {
        console.log('faild doc', res)
        openFileFailed()
    }

    window.onBeforeSave = (doc) => {
        //alert('11')
    }

    window.onUploadFileSuccess = onUploadFileSuccess
    window.onUploadFileFailed = onUploadFileFailed

    window.OnAddinLoad = (ribbonUI) => {
        //alert('OnAddinLoad')
        console.log(ribbonUI)
        window.ribbonUI = ribbonUI

        //wps.ApiEvent.AddApiEventListener('DocumentBeforeSave', window.onBeforeSave)
        return true
    }

    window.OnAction = (control) => {
        console.log(control)
        let doc = wps.WpsApplication().ActiveDocument
        console.log(doc)

        switch (control.Id) {
            case "btnSaveAsLocalFile":
                saveAsLocalFile(doc)
                break;

            case 'btnSaveToDesktop':
                saveToDesktop(doc);
                break;

            case "btnShowRevision":
                //显示痕迹
                openRevision(doc, true, true)
                break;

            case "btnHideRevision":
                //隐藏痕迹
                openRevision(doc, true, false)
                break;

            case "btnSaveToServer":
                //保存到服务器
                saveFileToServer(doc)
                break;

            case "btnExportAsPDF":
                btnExportAsPDF(doc)
                break;
        }

        return true
    }

    window.GetImage = (control) => {
        var eleId = typeof (control) == "object" ? control.Id : control;
        switch (eleId) {
            case "btnSaveToServer":
                return "./w_Save.png"

            case "btnSaveAsLocalFile":
                return "./w_SaveAs.png"

            default:
                return ""
        }
    }
}


initFuncs()
window.onload = () => {
    initFuncs()
}