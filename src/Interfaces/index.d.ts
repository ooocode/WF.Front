
interface Info {
    userName: string
    access_token: string
    downloadUrl: string
    uploadUrl: string
    readonly: boolean
}

interface Window {
    OnAddinLoad: (ribbonUI: any) => boolean
    OnAction: (control: any) => boolean
    dispatch: (info: Info) => void
    OnTabEnabled: () => boolean

    openFileSuccess: () => void
    openFileFailed: (res: any) => void

    onBeforeSave: (doc: object) => void
    ribbonUI: any

    onUploadFileSuccess: (res: any) => void
    onUploadFileFailed: (err: any) => void

    GetImage: (control: any) => string
}