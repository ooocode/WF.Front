import React, { useContext, useState } from "react"
import { FormAttachments } from "./FormAttachments"
import { Button, Dropdown, Menu, message, notification, Space } from 'antd';
import { FileImageOutlined, FilePdfOutlined, FileWordOutlined } from '@ant-design/icons';
import { FormContext, ICancel } from "../hooks/useTask";
import { attachmentsClient, processInstancesClient, useUser } from "../hooks/useApi";
import { useToggle } from "../hooks/useToggle";
import { messageBox, notificationError } from "../messageBox";
import { UrgeDialog } from "./UrgeDialog";
import { withPrefix } from "gatsby";
import { openFileByWps } from "../hooks/wps";
import FeedbackDlg from "./FeedbackDlg";
import { TakebackDlg } from "./TakebackDlg";
import { isSSR, workFlowBaseUrl } from "../Commmon/consts";
import { useFormQueryString } from "../hooks/useFormQueryString";
import { ReStartProcessViewModel } from "../WorkFlowApi";


interface IImageProps {
    children?: React.ReactNode,
    src: string,
    alt: string,
    onClick?: React.MouseEventHandler<HTMLSpanElement>
}


export function FormHeader() {
    const formAttachmentsVisualState = useToggle()
    const backgroundAttachmentVisualState = useToggle()
    const urgeDlgViusal = useToggle()
    const takebackDlgViusal = useToggle()

    const formContext = useContext(FormContext)
    const { access_token, mainDepartment, userName, userDisplayName } = useUser()
    const { mode, prodefKey, businessKey } = useFormQueryString()
    const tempSaveTaskBtnClicked = async () => {
        let cancel: ICancel = { value: false }

        if (formContext) {
            await formContext.onBeforeTempSave.current(cancel)
            if (cancel.value) {
                return
            }
        }

        formContext?.TempSaveTask()
    }
    /**
     * 打开办文过程页面
     */
    const openDealProcessPage = () => {
        var access_tokenQuery = `&access_token=${access_token}`
        window.open(`${workFlowBaseUrl}/FormPages/DealProcess?BusinessKey=${formContext?.task?.value?.form?.businessKey}${access_tokenQuery}`)
    }

    /**
     * 打开流程图
     */
    const openFlowPicture = () => {
        window.open(`${workFlowBaseUrl}/BpmnModel?processDefinitionId=${formContext?.task?.value?.form?.processDefId}`)
    }

    const takeBack = () => {
        takebackDlgViusal.Toggle()
        /*const client = new UserTasksClient(workFlowBaseUrl, { fetch: fetchClient })
        client.cancelAllForActivity(formContext?.task?.value?.taskId ?? '').then(() => {
            notification.success({ message: '撤回成功,已在待办列表中' })
        }).catch(err => {
            if (err instanceof ErrorModel) {
                notification.error({ message: err.error?.message })
            } else if (err instanceof Error) {
                notification.error({ message: err.message })
            }
        })*/
    }

    const openPrintForm = (format: 'pdf' | 'png' | 'docx' | 'external-FWGL-word' | 'FWGL-word' | 'none') => {
        var access_tokenQuery = `&access_token=${access_token}`
        if (format === 'external-FWGL-word') {
            window.open(`${workFlowBaseUrl}/FormPages/Print/${prodefKey}?handler=PrintWordWithExt&BusinessKey=${formContext?.task?.value?.form?.businessKey}&download=false&format=${format}${access_tokenQuery}`)
            return
        }

        if (format === 'FWGL-word') {
            window.open(`${workFlowBaseUrl}/FormPages/Print/${prodefKey}?handler=PrintWord&BusinessKey=${formContext?.task?.value?.form?.businessKey}&download=false&format=${format}${access_tokenQuery}`)
            return
        }

        if (format === 'none') {
            window.open(`${workFlowBaseUrl}/FormPages/Print/${prodefKey}?BusinessKey=${formContext?.task?.value?.form?.businessKey}&download=false&format=${format}${access_tokenQuery}`)
        } else {
            window.open(`${workFlowBaseUrl}/FormPages/Print/${prodefKey}?BusinessKey=${formContext?.task?.value?.form?.businessKey}&download=true&format=${format}${access_tokenQuery}`)
        }
    }

    //打包下载
    const downloadAll = () => {
        var onlyShowNullTagAttachments = false
        if (prodefKey === 'FWGL') {
            if (formContext?.task.value?.activityName === '各单位收文' || formContext?.task.value?.activityName == '相关人员阅') {
                onlyShowNullTagAttachments = true
            }
        }
        window.open(`${workFlowBaseUrl}/api/FormAttachments/DownloadAllAttachments?businessKey=${formContext?.task?.value?.form?.businessKey}&onlyShowNullTagAttachments=${onlyShowNullTagAttachments}&userName=${userName}&proDefKey=${prodefKey}`)
    }

    //催办
    const urge = () => {
        urgeDlgViusal.Toggle()
    }

    const gotoModifyMyOpinionPage = () => {
        window.open(withPrefix(`/FormPages/OtherPages/ModifyMyOpinion?processDefKey=${prodefKey}&businessKey=${formContext?.task.value?.form?.businessKey}`))
    }

    const toGWJHFW = () => {
        //processInstancesClient('john', formContext?.task.value?.form?.businessKey)
        // .then(res => notification.success({ message: '转公文交换成功' }))
        //.catch(err => messageBox(err))
    }

    const reStartProcess = () => {
        if (businessKey) {
            var vm = new ReStartProcessViewModel()
            vm.businessKey = businessKey
            vm.userName = userName
            processInstancesClient.reStartProcess(vm).then(res => {
                notification.success({
                    message: "重办成功，请回到待办列表查看"
                })
            }).catch(err => notificationError('重办失败', err))
        }
    }


    const moreMenu = (
        <Menu>
            {(mainDepartment === '区市监局/办公室' || mainDepartment === '区市监局/局领导') && <Menu.Item key='修改表单中我的意见'>
                <Button onClick={gotoModifyMyOpinionPage} type="text">
                    修改表单中我的意见
                </Button>
            </Menu.Item>}

            <Menu.Divider key='dev1'></Menu.Divider>

            <Menu.Item key='打包下载'>
                <Button onClick={downloadAll} type="text">
                    打包下载
                </Button>
            </Menu.Item>

            {prodefKey !== 'FWGL' && <Menu.Item key='下载处理笺(pdf)'>
                <Menu.Item>
                    <Button onClick={() => openPrintForm('pdf')} type="text">
                        下载处理笺(pdf)
                    </Button>
                </Menu.Item>
            </Menu.Item>}


            {(prodefKey === 'FWGL' || prodefKey === 'IPM.WF.XFWGL') && <Menu.Item key='下载发文处理笺(Word)'>
                <Button onClick={() => openPrintForm('FWGL-word')} type="text">
                    下载发文处理笺(Word)
                </Button>
            </Menu.Item>}

            {prodefKey !== 'FWGL' && prodefKey !== 'IPM.WF.XFWGL' && <Menu.Item key='下载处理笺(Word)'>
                <Button onClick={() => openPrintForm('docx')} type="text">
                    下载处理笺(Word)
                </Button>
            </Menu.Item>}


            {(prodefKey === 'FWGL' || prodefKey === 'IPM.WF.XFWGL') && <Menu.Item key='下载联合发文处理笺(Word)'>
                <Button onClick={() => openPrintForm('external-FWGL-word')} type="text">
                    下载联合发文处理笺(Word)
                </Button>
            </Menu.Item>}


            {prodefKey !== 'FWGL' && <Menu.Item key='下载处理笺(图片)'>
                <Button onClick={() => openPrintForm('png')} type="text">
                    下载处理笺(图片)
                </Button>
            </Menu.Item>}

            <Menu.Divider></Menu.Divider>
            <Menu.Item key='催办'>
                <Button onClick={() => urge()} type="text">
                    催办
                </Button>
            </Menu.Item>
            {mode === 'done' && <Menu.Item key='重办'>
                <Button onClick={reStartProcess} type="text">
                    重办
                </Button>
            </Menu.Item>}

            <Menu.Item key='流程图'>
                <Button onClick={() => openFlowPicture()} type="text">
                    流程图
                </Button>
            </Menu.Item>
        </Menu>
    );

    const printMenu = (
        <Menu>
            <Menu.Item>
                <Button icon={<FilePdfOutlined />} onClick={() => openPrintForm('none')} type="text">
                    打印预览
                </Button>
            </Menu.Item>
            <Menu.Item>
                <Button icon={<FilePdfOutlined />} onClick={() => openPrintForm("pdf")} type="text">
                    打印为pdf文件
                </Button>
            </Menu.Item>
            <Menu.Item>
                <Button icon={<FileWordOutlined />} onClick={() => openPrintForm("docx")} type="text">
                    打印为Word文件
                </Button>
            </Menu.Item>
            <Menu.Item>
                <Button icon={<FileImageOutlined />} onClick={() => openPrintForm("png")} type="text">
                    打印为图片
                </Button>
            </Menu.Item>
        </Menu>
    );

    const Image = (props: IImageProps) => {
        const [isIn, setIsIn] = useState<boolean>(false)
        return <span onMouseOver={e => setIsIn(true)}
            onClick={props.onClick}
            onMouseOut={e => setIsIn(false)}
            style={{ cursor: 'pointer', background: isIn ? 'url(/images/btns/btn_YellowBG.gif)' : "" }}>
            <img src={props.src} alt={props.alt} />
            <span style={{ fontSize: 11, paddingTop: 20, color: '#1B53B1' }}>{props.children}</span>
        </span>
    }


    const openMainDoc = async () => {
        try {
            let files = formContext?.attachments.value?.filter(e => e.orignFileName === '正文.pdf')
            if (files?.length === 1) {
                window.open(`${workFlowBaseUrl}/spa/pdfjs/web/viewer.html?file=${files[0].downloadUrl}`)
                //window.open(files[0].downloadUrl)
                return
            }

            files = formContext?.attachments.value?.filter(e => e.orignFileName === '正文.docx')
            if (files?.length === 1) {
                var file = files[0]
                const url = await attachmentsClient.getAttachmentNewestUploadAndDownloadUrl(file.downloadUrl)

                var canEdit = formContext?.task?.value?.canUploadOrUpdateFiles === true && mode === 'todo'
                await openFileByWps({
                    userName: userDisplayName ?? '',
                    access_token: access_token ?? '',
                    downloadUrl: url.downloadUrl ?? '',
                    uploadUrl: url.uploadUrl ?? '',
                    readonly: !canEdit
                })
                message.success('正在打开正文......')
            }
        } catch (error) {
            messageBox(error)
        }
    }

    return <>
        <Space style={{ marginBottom: 10 }} size='middle' /* {[8, 16]} */ wrap>
            {/* {formContext?.mode === 'todo' ? <Button onClick={tempSaveTaskBtnClicked} icon={<MailOutlined />} type="text">
                暂存
            </Button> : <></>} */}

            {mode === 'todo' ? <Image src={withPrefix("/images/btns/btn_TempSave.gif")} alt='暂存'
                onClick={tempSaveTaskBtnClicked} /> : <></>}

            {prodefKey === 'FWGL' && mode === 'todo' && formContext?.task.value?.isJustCreated === true && <Image src={withPrefix("/images/btns/icoNew.gif")} alt='粘贴正文'
                onClick={openMainDoc}>粘贴正文</Image>}


            {prodefKey === 'FWGL' && formContext?.task.value?.isJustCreated === false && <Image src={withPrefix("/images/btns/icoNew.gif")} alt='正文'
                onClick={openMainDoc}>正文</Image>}

            {mode === 'todo' && <Image src={withPrefix("/images/btns/icoNew.gif")} alt='附件'
                onClick={formAttachmentsVisualState.Toggle}>附件</Image>}


            {mode === 'todo' && formContext?.task.value?.form?.externalSystemBusinessKey &&
                (formContext.task.value.activityName === '办公室收文员' || formContext?.task.value.activityName?.indexOf('主办') !== -1) && <Image src={withPrefix("/images/btns/icoNew.gif")}
                    alt='处理情况'
                    onClick={formContext.feedbackModalVisual.Toggle}>处理情况</Image>}


            {prodefKey === 'FWGL' && mode === 'todo' && <Image src={withPrefix("/images/btns/icoNew.gif")} alt='关联材料'
                onClick={backgroundAttachmentVisualState.Toggle}>关联材料</Image>}


            {/*   {formContext?.mode === 'todo' ? <Button icon={<FileAddOutlined />} onClick={() => formAttachmentsVisualState.Toggle()} type="text">
                附件
            </Button> : <></>} */}

            {/* {formContext?.prodefKey === 'FWGL' ? <Button icon={<FileAddOutlined />} onClick={() => backgroundAttachmentVisualState.Toggle()} type="text">
                关联材料
            </Button> : <></>} */}

            {/*   <Button icon={<OrderedListOutlined />} onClick={() => openDealProcessPage()} type="text">
                办文过程
            </Button> */}

            {prodefKey?.startsWith('IPM.') === false && <Image src={withPrefix("/images/btns/icoLog.gif")}
                alt='办文过程'
                onClick={openDealProcessPage}>办文过程</Image>}

            {prodefKey !== 'QJGL_GXJ' && <>
                <Image src={withPrefix('/images/btns/print.gif')} alt='打印' onClick={e => openPrintForm('none')}></Image>
            </>}

            <Image src={withPrefix("/images/btns/btn_Attach2.gif")} alt='打包下载'
                onClick={downloadAll}>打包下载</Image>
            {/*   <Button icon={<DownloadOutlined />} onClick={() => downloadAll()} type="text">
                打包下载
            </Button>
 */}


            {/*   {formContext?.mode === 'done' ? <Button icon={<AppstoreOutlined />} onClick={() => takeBack()} type="text">
                撤回
            </Button> : <></>} */}

            {mode === 'done' ? <Image src={withPrefix("/images/btns/icoUndo1.gif")} alt='撤回'
                onClick={takeBack}>撤回</Image> : <></>}



            <Dropdown overlay={moreMenu} trigger={['click']}>
                <button style={{ marginTop: 4 }} type="button" className="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" onClick={e => e.preventDefault()}>
                    其他
                </button>
            </Dropdown>

            {/*   <Image src='/images/btns/print.gif' alt='更多' onClick={e => openPrintForm('none')}></Image> */}
            {/*  {formContext?.prodefKey !== 'QJGL_GXJ' && <>
                <Dropdown overlay={printMenu} trigger={['click']}>
                    <Button icon={<PrinterOutlined />} onClick={e => e.preventDefault()} type="text">
                        打印
                    </Button>
                </Dropdown>
            </>}
 */}
            {/* <Dropdown overlay={moreMenu} trigger={['click']}>
                <Button icon={<MoreOutlined />} onClick={e => e.preventDefault()} type="text">
                    更多
                </Button>
            </Dropdown> */}
        </Space>

        <div style={{ textAlign: 'right', marginBottom: 10 }}>
            <img src="/images/btns/btn_Close.gif" alt="" onClick={() => (!isSSR) && window.close()} />
        </div>

        <FormAttachments ModalVisualState={formAttachmentsVisualState} />
        {prodefKey === 'FWGL' ? <FormAttachments ModalVisualState={backgroundAttachmentVisualState} tag="背景材料" /> : <></>}
        <UrgeDialog visual={urgeDlgViusal} businessKey={formContext?.task?.value?.form?.businessKey ?? ''} />
        <TakebackDlg visual={takebackDlgViusal} businessKey={formContext?.task?.value?.form?.businessKey ?? ''}></TakebackDlg>
        <FeedbackDlg></FeedbackDlg>
    </>
}