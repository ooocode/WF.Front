import { Button, Modal, Space } from "antd"
import React, { useContext, useEffect, useRef, useState } from "react"
import { Select } from 'antd';
import { SelectValue } from "antd/lib/select"
import { ExclamationCircleOutlined } from "@ant-design/icons";
import TextArea from "antd/lib/input/TextArea";
import { FormContext } from "../hooks/useTask";
import { userCustomOpinionsClient, opinionTypesClient, useUser } from "../hooks/useApi";
import { useToggle } from "../hooks/useToggle";
import { messageBox } from "../messageBox";
import { UserCustomOpinionViewModel, OpinionTypeViewModel } from "../WorkFlowApi";
import { useFormQueryString } from "../hooks/useFormQueryString";
const { confirm } = Modal;
const { Option } = Select;

export const OpinionAreaNewStyle = () => {
    const formContext = useContext(FormContext)
    const { prodefKey, mode } = useFormQueryString()
    const showDlg = useToggle()
    const selected = useRef<string>('')

    const [uerCustomOpinions, setUserCustomOpinions] = useState<UserCustomOpinionViewModel[]>([])

    const reloadDiyOpinions = useToggle()
    const { userName } = useUser()
    useEffect(() => {
        if (userName) {
            userCustomOpinionsClient.getUserCustomOpinionsForNewFlow(userName).then(opts => {
                setUserCustomOpinions(opts)
            }).catch(err => messageBox(err))
        }
    }, [reloadDiyOpinions.value, userName])

    const diyBtnClick = () => {
        showDlg.Toggle()
    }

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


    const [opinionTypes, setOpinionTypes] = useState<OpinionTypeViewModel[]>([])
    useEffect(() => {
        if (prodefKey) {
            opinionTypesClient.getOpinionTypes(prodefKey).then(res => {
                setOpinionTypes(res)
                console.log(res)
            }).catch(err => messageBox(err))
        }
    }, [prodefKey])


    const flowHandler = () => {
        let canScanOpinion = opinionTypes.findIndex(e => e.arrAllowEditOnActvities?.indexOf(formContext?.task?.value?.activityName ?? '') !== -1) !== -1
        if (formContext?.task?.value?.curUserHasAnyOpinion === false && (formContext.watch('opinion')?.trim().length ?? 0) === 0 && canScanOpinion) {
            confirm({
                icon: <ExclamationCircleOutlined />,
                cancelText: "返回填写意见",
                okText: "不填意见继续处理",
                content: <>您尚未填写意见，确定不填意见继续处理吗？</>,
                onOk() {
                    formContext.selectUsersModalVisual.Toggle()
                },
                onCancel() {
                    console.log('Cancel');
                },
            });
        } else {
            formContext?.selectUsersModalVisual.Toggle()
        }
    }


    return <div>
        <div className="mt-2">
            {
                opinionTypes.map(type => {
                    return <div key={type.id}>
                        {type.arrAllowEditOnActvities?.findIndex(e => e === formContext?.task?.value?.activityName) !== -1 ? <>
                            <label className='text-danger'>{(type?.displayName?.trim()?.length ?? 0) > 0 ? type.displayName : type.name}：</label>
                            <textarea value={formContext?.watch('opinion')} onChange={e => { setOpinion(e.target.value); }} className="form-control"></textarea>
                            <div>
                                <Modal title="自拟意见"
                                    maskTransitionName=""
                                    transitionName=""
                                    visible={showDlg.value}
                                    centered
                                    footer={<DlgFooter />}
                                    maskClosable={true}
                                    onCancel={() => showDlg.Toggle()}>

                                    <Select
                                        style={{ width: '100%' }}
                                        placeholder=""
                                        onChange={(e, o) => onChange(e, o)}
                                    >
                                        {uerCustomOpinions.map(item => (
                                            <Option key={item.stringId ?? ''} value={item.stringId ?? ''}>{item.text}</Option>
                                        ))}
                                    </Select>
                                    <textarea value={formContext?.watch('opinion')} onChange={e => { setOpinion(e.target.value); }} className="form-control" />
                                </Modal>
                                <div className="mt-2">
                                    <Space>
                                        {
                                            type.arrOpinionButtons?.map(item => {
                                                return <Button onClick={() => { setOpinion(item); }} key={item}>{item}</Button>
                                            })
                                        }
                                        <Button onClick={() => diyBtnClick()}>自拟意见</Button>
                                        <Button onClick={() => flowHandler()} danger type='primary'>流程处理</Button>
                                    </Space>
                                </div>
                            </div>
                        </> : <></>}
                    </div>
                })
            }
        </div>

        {
            (mode === 'todo' && opinionTypes.findIndex(e => e.arrAllowEditOnActvities?.indexOf(formContext?.task?.value?.activityName ?? '') !== -1) === -1) ? <div className="text-center">
                <Button onClick={() => flowHandler()} danger type='primary'>流程处理</Button>
            </div> : <></>
        }
    </div>
}
