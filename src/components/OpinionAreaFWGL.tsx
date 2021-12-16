import { Button, Form, message, Modal, Space } from "antd"
import React, { useContext, useEffect, useRef, useState } from "react"
import { Select } from 'antd';
import { SelectValue } from "antd/lib/select"
import { ExclamationCircleOutlined } from "@ant-design/icons";
import TextArea from "antd/lib/input/TextArea";
const { confirm } = Modal;
const { Option } = Select;
import { Tabs } from 'antd';
import { Console } from "console";
import { FormContext, ICancel } from "../hooks/useTask";
import { userCustomOpinionsClient, opinionTypesClient, usersClient, departmentsClient, attachmentsClient, useUser } from "../hooks/useApi";
import { useStateEx, useToggle } from "../hooks/useToggle";
import { messageBox } from "../messageBox";
import { UserCustomOpinionViewModel, OpinionTypeViewModel, OpinionViewModel, DepartmentTreeNode } from "../WorkFlowApi";
import { FormAttachmentsPreviewBox } from "./FormAttachmentsPreviewBox";
import { openFileByWps } from "../hooks/wps";
import { useAsync } from "react-use";
import { useFormQueryString } from "../hooks/useFormQueryString";

const { TabPane } = Tabs;


export function OpinionAreaFWGL() {
    const formContext = useContext(FormContext)
    const showDlg = useToggle()
    //const [diy, setDiy] = useState<string>()
    const selected = useRef<string>('')

    const reloadDiyOpinions = useToggle()

    const { userName, userDisplayName, mainDepartment, access_token } = useUser()
    const { prodefKey, mode } = useFormQueryString()

    const uerCustomOpinions = useAsync(async () => {
        if (userName) {
            const res = await userCustomOpinionsClient.getUserCustomOpinionsForNewFlow(userName)
            return res
        }
    }, [reloadDiyOpinions.value, userName])


    useEffect(() => {
        if (showDlg.value && uerCustomOpinions.loading === false && uerCustomOpinions.value) {
            if ((uerCustomOpinions.value?.length ?? 0) > 0 && (formContext?.watch('opinion')?.length ?? 0) === 0) {
                setOpinion(uerCustomOpinions.value[0].text ?? '')
            }
        }
    }, [showDlg.value, uerCustomOpinions.loading])


    /**
     * 保存自定义意见
     */
    const saveClick = () => {
        let vm = new UserCustomOpinionViewModel()
        vm.userName = userName
        vm.text = formContext?.watch('opinion')
        userCustomOpinionsClient.postUserCustomOpinion(vm).then(() => {
            reloadDiyOpinions.Toggle()
            messageBox('添加成功')
        }).catch(err => messageBox(err))
    }

    const setOpinion = (op: string) => {
        formContext?.setValue('opinion', op)
    }

    const onChange = (id: SelectValue, option: any) => {
        selected.current = id?.toString() ?? ''
        setOpinion(option.children)
    }

    const deleteItem = () => {
        if (selected.current !== '') {
            userCustomOpinionsClient.deleteUserCustomOpinion(selected.current).then(() => {
                messageBox('删除成功')
                selected.current = ''
                reloadDiyOpinions.Toggle()
            })
        }
    }

    const DlgFooter = () => {
        return <>
            <Space>
                <Button size='middle' onClick={() => saveClick()}>保存本次意见</Button>
                <Button danger size='middle' onClick={() => deleteItem()}>删除意见</Button>
                <Button onClick={() => showDlg.Toggle()} type='primary' size='middle'>确定</Button>
            </Space>
        </>
    }


    const opinionTypes = useAsync(async () => {
        if (prodefKey !== null) {
            const res = await opinionTypesClient.getOpinionTypes(prodefKey)
            return res
        }
    }, [prodefKey])



    const flowHandler = async () => {
        let cancel: ICancel = { value: false }
        if (formContext) {
            await formContext.onBeforeFlowProcessingBtnClicked.current(cancel)
            if (cancel.value) {
                return
            }
        }

        let canScanOpinion = opinionTypes.value?.findIndex(e => e.arrAllowEditOnActvities?.indexOf(formContext?.task?.value?.activityName ?? '') !== -1) !== -1
        if (formContext?.task?.value?.curUserHasAnyOpinion === false && (formContext.watch('opinion')?.trim().length ?? 0) === 0 && canScanOpinion) {
            confirm({
                icon: <ExclamationCircleOutlined />,
                cancelText: "返回填写意见",
                okText: "不填意见继续处理",
                content: <>您尚未填写意见，确定不填意见继续处理吗？</>,
                maskClosable: true,
                onOk() {
                    formContext?.selectUsersModalVisual.Toggle()
                },
                onCancel() {
                    console.log('Cancel');
                },
            });
        } else {
            formContext?.selectUsersModalVisual.Toggle()
        }
    }



    const OpinionsGroupByDepartment = ({ type }: { type: OpinionViewModel }) => {
        var ds = type.opinionItems?.map(e => e.user?.mainDepatment ?? "");
        var departments = new Set(ds) // 这个方法最简便 
        var arrDep = Array.from(departments)

        if ((type?.opinionItems?.length ?? 0) > 0) {
            return <Tabs type="card">
                <TabPane tab="全部意见" key="1">
                    {arrDep.map(t => {
                        return <div key={t}>
                            <b style={{ fontSize: 16 }}>{t.replace('区市监局/', '')}</b><br />
                            {type.opinionItems?.filter(e => e?.user?.mainDepatment === t).map(opt => {
                                return <span key={opt.opinion?.id}
                                    style={{ wordBreak: 'break-word', fontSize: 16, color: 'black' }}>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{opt.opinion?.text}〔{opt.user?.name} {opt.formatDateTime}〕<br />
                                </span>
                            })}
                        </div>
                    })}

                </TabPane>

                <TabPane tab="只显示处室负责人意见" key="2">
                    {type.opinionItems?.filter(e => e.user?.isLeader === true).map(opt => {
                        return <span key={opt.opinion?.id}
                            style={{ wordBreak: 'break-word', fontSize: 16, color: 'black' }}>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{opt.opinion?.text}〔{opt.user?.name} {opt.formatDateTime}〕<br />
                        </span>
                    })}
                </TabPane>

                <TabPane tab="只显示本部门意见" key="3">
                    {type.opinionItems?.filter(e => e.user?.mainDepatment === mainDepartment).map(opt => {
                        return <span key={opt.opinion?.id}
                            style={{ wordBreak: 'break-word', fontSize: 16, color: 'black' }}>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{opt.opinion?.text}〔{opt.user?.name} {opt.formatDateTime}〕<br />
                        </span>
                    })}
                </TabPane>
                {/*  <TabPane tab="Tab 3" key="3">
            Content of Tab Pane 3
        </TabPane> */}
            </Tabs>
        } else {
            return <></>
        }
    }

    const OpinionGroup = ({ type }: { type: OpinionViewModel }) => {
        return <> {type.opinionItems?.map(opt => {
            return <span key={opt.opinion?.id}
                style={{ wordBreak: 'break-word', fontSize: 16, color: 'black' }}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{opt.opinion?.text}〔{opt.user?.name} {opt.formatDateTime}〕<br />
            </span>
        })}</>
    }

    const openMainDoc = async () => {
        try {
            const files = formContext?.attachments.value?.filter(e => e.orignFileName === '正文.docx')
            if (files?.length === 1) {
                var file = files[0]
                const url = await attachmentsClient.getAttachmentNewestUploadAndDownloadUrl(file.downloadUrl)
                await openFileByWps({
                    userName: userDisplayName ?? '',
                    access_token: access_token ?? '',
                    downloadUrl: url.downloadUrl ?? '',
                    uploadUrl: url.uploadUrl ?? '',
                    readonly: (formContext?.task?.value?.canUploadOrUpdateFiles ?? false) === false
                })
                message.success('正在打开正文......')
            }
        } catch (error) {
            messageBox(error)
        }
    }

    return <>
        {
            formContext?.opinions.value?.map((type, index) => {
                return <div key={type.opinionType?.id} className='form-group'>

                    <label className='text-danger'>{(type.opinionType?.displayName?.trim()?.length ?? 0) > 0 ? type.opinionType?.displayName : type.opinionType?.name}：</label>
                    <div>
                        {(type.opinionType?.name.indexOf('会办') !== -1 || type.opinionType.name.indexOf('会签') !== -1 || type.opinionType.displayName?.indexOf('会办') !== -1 || type.opinionType.displayName.indexOf('会签') !== -1) ?
                            <OpinionsGroupByDepartment type={type} /> : <OpinionGroup type={type} />}
                    </div>

                    {mode === 'todo' ? <div>
                        {type.opinionType?.arrAllowEditOnActvities?.findIndex(e => e === formContext.task?.value?.activityName) !== -1 ? <>
                            <textarea value={formContext.watch('opinion')}
                                onChange={e => { setOpinion(e.target.value); }}
                                placeholder="在此输入意见"
                                className="form-control mt-2" />
                            <div>
                                <Modal title="自拟意见"
                                    visible={showDlg.value}
                                    maskTransitionName=""
                                    transitionName=""
                                    centered
                                    footer={<DlgFooter />}
                                    maskClosable={true}
                                    onCancel={() => showDlg.Toggle()}>

                                    <Select
                                        style={{ width: '100%' }}
                                        placeholder=""
                                        defaultValue={uerCustomOpinions.value && (uerCustomOpinions.value?.length ?? 0) > 0 ? uerCustomOpinions.value[0].text : ''}
                                        onChange={(e, o) => onChange(e, o)}
                                    >
                                        {uerCustomOpinions.value?.map((item, index) => (
                                            <Option key={index} value={item.stringId ?? ''}>{item.text}</Option>
                                        ))}
                                    </Select>
                                    <TextArea value={formContext.watch('opinion')}
                                        onChange={e => { setOpinion(e.target.value) }}
                                        className="form-control"
                                        allowClear />
                                </Modal>
                                <div className="mt-2">
                                    <Space>
                                        <Button onClick={openMainDoc}>查阅正文</Button>
                                        {
                                            type.opinionType?.arrOpinionButtons?.map(item => {
                                                return <Button onClick={() => { setOpinion(item); }} key={item}>{item}</Button>
                                            })
                                        }
                                        <Button onClick={showDlg.Toggle}>自拟意见</Button>
                                        <Button onClick={() => flowHandler()} danger htmlType="submit" type='primary'>流程处理</Button>
                                    </Space>
                                    <div style={{ border: '1px solid black', marginTop: 10, paddingLeft: 20 }}>
                                        <FormAttachmentsPreviewBox hideEditStatus={true}></FormAttachmentsPreviewBox>
                                    </div>
                                </div>
                            </div>
                        </> : <></>}
                    </div> : <></>}

                    {index !== ((formContext?.opinions.value?.length ?? 0) - 1) && <hr />}
                </div>
            })
        }

        {
            (mode === 'todo' && opinionTypes.value?.findIndex(e => e.arrAllowEditOnActvities?.indexOf(formContext?.task?.value?.activityName ?? '') !== -1) === -1) ? <div className="text-center">
                <div style={{ border: '1px solid black', marginTop: 10 }}>
                    <FormAttachmentsPreviewBox hideEditStatus={true}></FormAttachmentsPreviewBox>
                </div>
                <Button onClick={flowHandler} danger htmlType="submit">流程处理</Button>
            </div> : <></>
        }

        {(mode === 'done' || mode === 'common') && <div style={{ border: '1px solid black', marginTop: 10 }}>
            <FormAttachmentsPreviewBox hideEditStatus={true}></FormAttachmentsPreviewBox>
        </div>}
    </>
}
