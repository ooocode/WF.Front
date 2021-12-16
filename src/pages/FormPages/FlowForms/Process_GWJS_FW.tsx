import React from "react";
import { Button, Form, Input, notification, Radio, Select, Tag, Transfer } from "antd";
import { useContext, useEffect, useState } from "react";
import { FormContext, FormFieldKeyType, useTask } from "../../../hooks/useTask";
import FormPage from "../../../components/FormPage";
import { FormDetailViewModel, UserReply, UsersOfDepartmentDto } from "../../../WorkFlowApi";
import { lookTaskMode } from "../../../Commmon/task";
import TextArea from "antd/lib/input/TextArea";
import { departmentsClient, receivingUnitsClient } from "../../../hooks/useApi";
import { FormAttachmentsPreviewBox } from "../../../components/FormAttachmentsPreviewBox";
import { messageBox } from "../../../messageBox";
import { ReceivingUnit } from "../../../../apis/GWExchange";
import MyDialog from "../../../components/MyDialog";
import { useToggle } from "../../../hooks/useToggle";
import { TransferDirection } from "antd/lib/transfer";
import axios from "axios";
import { workFlowBaseUrl } from "../../../Commmon/consts";
import { useFormQueryString } from "../../../hooks/useFormQueryString";
const { Option } = Select

const fileTypes = ['办件', '阅件']

//办件
const banjianEmergencyLevels = [
    { name: '其他类型', days: 0 },
    { name: '特急件', days: 1 },
    { name: '加急件', days: 5 },
    { name: '普通一类', days: 12 },
    { name: '普通二类', days: 25 },
    { name: '普通三类', days: 110 },
    { name: '督办件', days: 999 }]

const yuejianEmergencyLevels = [
    { name: '普通', days: 10 },
    { name: '加急件', days: 5 },
    { name: '特急件', days: 1 }
]


const comUnits = ['其他', "中办国办", "国家部委", "自治区党委", "区内来文"]

//const levels = ["普通", "一般"]
//const emergencyLevels = ["一般", "急", "特急"]
//const title = "广西壮族自治区市场监督管理局公文交换文件"
const title = ""

export default () => {
    const onloadTaskSuccessAfter = (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => {
        console.log(user)
        if (mode === 'todo' && task.isJustCreated) {
            if ((formFields.get('tel')?.length ?? 0) === 0) {
                formFields.set('tel', user?.phoneNumber ?? '')
            }

            if ((formFields.get('name')?.length ?? 0) === 0) {
                formFields.set('name', user?.name ?? '')
            }


            if ((formFields.get('fileType')?.length ?? 0) === 0) {
                formFields.set('fileType', fileTypes[0])
            }

            if ((formFields.get('emergencyLevel')?.length ?? 0) === 0) {
                formFields.set('emergencyLevel', banjianEmergencyLevels[0].name)
            }

            if ((formFields.get('unit')?.length ?? 0) === 0) {
                formFields.set('unit', user.mainDepatment?.split('/')?.reverse()[0] ?? '')
            }

            if ((formFields.get('cwrq')?.length ?? 0) === 0) {
                formFields.set('cwrq', new Date().toLocaleDateString())
            }

            if ((formFields.get('yfrq')?.length ?? 0) === 0) {
                formFields.set('yfrq', new Date().toLocaleDateString())
            }

            if ((formFields.get('fh')?.length ?? 0) === 0) {
                formFields.set('fh', '5')
            }

            if ((formFields.get('fkyqlb')?.length ?? 0) === 0) {
                formFields.set('fkyqlb', '无反馈')
            }

            if ((formFields.get('sfsjbmlw')?.length ?? 0) === 0) {
                formFields.set('sfsjbmlw', '否')
            }
        }
    }

    const formContext = useTask({ onloadTaskSuccessAfter: onloadTaskSuccessAfter })

    return <FormContext.Provider value={formContext}>
        <FormPage>
            <div className="text-center">
                <h3 className="text-red"><b>{title}</b></h3>
                <Input
                    value={formContext?.watch('archNo')}
                    onChange={e => formContext.setValue('archNo', e.target.value.trim())}
                    style={{ textAlign: 'center' }}></Input>
                <div className="text-right">
                    <Button type="link">流程状态：<u>{formContext?.task?.value?.activityName}</u></Button>
                </div>
            </div>

            {formContext.task?.value?.canEditForm === true ? <EditForm /> : <ReadOnlyForm />}
        </FormPage>
    </FormContext.Provider>
}


const EditForm = () => {
    const formContext = useContext(FormContext)
    const [units, setUnits] = useState<ReceivingUnit[]>([])
    const unitsDlgVisual = useToggle()
    const [selectedUnitKeys, setSelectedUnitKeys] = useState<string[]>(['广西测试单位'])
    const [leaders, setLeaders] = useState<UsersOfDepartmentDto[]>([])
    const [isOpenApp, setIsOpenApp] = useState(false)

    const { taskId } = useFormQueryString()

    useEffect(() => {
        receivingUnitsClient.getAll().then(res => {
            setUnits(res)
            formContext?.setValue('receivingUnits', JSON.stringify(res.filter(e => e.name === '广西测试单位')))
        }).catch(err => messageBox(err))
    }, [])

    const onChange = (targetKeys: string[], direction: TransferDirection, moveKeys: string[]) => {
        setSelectedUnitKeys(targetKeys)
        console.log(targetKeys)

        if (targetKeys.length > 0) {
            var temp = units.filter(e => targetKeys.findIndex(ee => e.name === ee) !== -1)
            console.log(temp)
            formContext?.setValue('receivingUnits', JSON.stringify(temp))
        }
    }

    useEffect(() => {
        departmentsClient.getDepartmentUsersByDepartmentName("区市监局/局领导").then(res => {
            setLeaders(res)
        }).catch(err => messageBox(err))
    }, [])

    useEffect(() => {
        const handler = setInterval(() => {
            formContext?.reloadAttachments.Toggle()
        }, 3000)

        return () => {
            clearInterval(handler)
        }
    }, [formContext])

    const RecvDialog = () => {
        return <MyDialog title="选择主送机关" open={unitsDlgVisual.value} onClose={unitsDlgVisual.Toggle}>
            <Transfer
                listStyle={{ height: 600, width: 300 }}
                dataSource={units}
                showSearch
                // filterOption={this.filterOption}
                targetKeys={selectedUnitKeys}
                onChange={onChange}
                //onSearch={this.handleSearch}
                rowKey={item => item.name ?? ''}
                render={item => item.name ?? ''}
                locale={{ itemUnit: '已选中的单位', itemsUnit: '未选中的单位' }}
            />
        </MyDialog>
    }

    useEffect(() => {
        if (formContext?.watch('fileType') === "办件") {
            formContext.setValue('emergencyLevel', banjianEmergencyLevels[0].name)
        } else {
            formContext?.setValue('emergencyLevel', yuejianEmergencyLevels[0].name)
        }
    }, [formContext?.watch('fileType')])

    const makeDoc = () => {
        setIsOpenApp(true)
        axios.post('http://localhost:58893/api/wps/MainDocumentToOfd', {
            WorkflowBaseUri: workFlowBaseUrl,
            Authorization: "Basic bGhsOjE=",
            TaskId: taskId,
            BusinessKey: formContext?.task?.value?.form?.businessKey
        }).then(res => {
            notification.success({ message: '打开成功，请盖章' })
        }).catch(err => {
            var text = JSON.stringify(err)
            if (text.indexOf('Network Error') !== -1) {
                notification.error({ message: "请先启动公文交换程序" })
            } else {
                notification.error({ message: "打开失败：" + JSON.stringify(err) })
            }
        }).finally(() => {
            setIsOpenApp(false)
        })
    }

    const emergencyLevelOnchange = (value: string) => {
        formContext?.setValue('emergencyLevel', value)
    }

    useEffect(() => {
        const emergencyLevel = formContext?.watch('emergencyLevel')
        if (formContext?.watch('fileType') === '办件') {
            let days = banjianEmergencyLevels
                .filter(e => e.name === emergencyLevel)[0]?.days?.toString() ?? '0'
            formContext.setValue('days', days)
        } else {
            let days = yuejianEmergencyLevels
                .filter(e => e.name === emergencyLevel)[0]?.days?.toString() ?? '0'
            formContext?.setValue('days', days)
        }
    }, [formContext?.watch('emergencyLevel')])

    useEffect(() => {
        let days = formContext?.watch('days') ?? '0'
        formContext?.setValue('endDate', new Date(new Date().getTime() + parseInt(days) * (1000 * 60 * 60 * 24)).toLocaleDateString())
    }, [formContext?.watch('days')])


    return (<div>
        <Form>
            <table className="table table-bordered table-bordered-danger">
                <tbody>
                    <tr>
                        <td>
                            文件类型：
                            <Select style={{ width: 100 }}
                                value={formContext?.watch('archType')}
                                onChange={e => formContext?.setValue('archType', e)}>
                                {fileTypes.map(e => {
                                    return <Option key={e} value={e}>{e}</Option>
                                })}
                            </Select>
                        </td>

                        <td>
                            办理等级：
                            {formContext?.watch('fileType') === '办件' && <Select style={{ width: 200 }}
                                value={formContext?.watch('emergencyLevel')}
                                onChange={emergencyLevelOnchange}>
                                {banjianEmergencyLevels.map(e => {
                                    return <Option key={e.name}
                                        value={e.name}>{e.name}</Option>
                                })}
                            </Select>}

                            {formContext?.watch('fileType') === '阅件' && <Select style={{ width: 200 }}
                                value={formContext?.watch('emergencyLevel')}
                                onChange={e => formContext?.setValue('emergencyLevel', e)}>
                                {yuejianEmergencyLevels.map(e => {
                                    return <Option
                                        key={e.name}
                                        value={e.name}>{e.name}</Option>
                                })}
                            </Select>}
                        </td>

                        <td>
                            发文机关：
                            <Input value={"自治区市监局"} style={{ width: 120 }}></Input>
                        </td>
                    </tr>

                    <tr>
                        <td>
                            签发人：
                            <Select value={formContext?.watch('leaderName')} style={{ width: 120 }}
                                onChange={(e) => formContext?.setValue('leaderName', e)}>
                                {leaders.map(e => {
                                    return <Option value={e.user?.name ?? ''}>{e.user?.name}</Option>
                                })}
                            </Select>
                        </td>

                        <td>
                            联系电话：
                            <Input
                                value={formContext?.watch('tel')}
                                onChange={e => formContext?.setValue('tel', e.target.value)}
                                style={{ width: 120 }} />
                        </td>
                        <td>
                            印发机关：
                            <Input
                                value={formContext?.watch('unit')}
                                onChange={e => formContext?.setValue('unit', e.target.value)}
                                style={{ width: 150 }} />
                        </td>
                    </tr>

                    <tr>
                        <td>
                            成文日期：
                            <Input type='text' value={formContext?.watch('cwrq')}
                                onChange={e => formContext?.setValue('cwrq', e.target.value)}
                                style={{ width: 120 }} />

                        </td>

                        <td>
                            印发日期：
                            <Input type='text' value={formContext?.watch('yfrq')}
                                onChange={e => formContext?.setValue('yfrq', e.target.value)}
                                style={{ width: 120 }} />
                        </td>

                        <td>
                            份号：
                            <Input type='number' value={formContext?.watch('fh')}
                                onChange={e => formContext?.setValue('fh', e.target.value)} style={{ width: 50 }} />

                        </td>
                    </tr>

                    <tr>
                        <td>
                            办结时间限制： (<Input
                                type='number'
                                value={formContext?.watch('days')}
                                onChange={formContext?.watch('emergencyLevel') === "其他类型" ? (e) => formContext.setValue('days', e.target.value) : undefined}
                                style={{ width: 80 }} />)(请填写数字)
                        </td>
                        <td>
                            要求办结时间：
                            <Input style={{ width: 120 }}
                                value={formContext?.watch('endDate')}></Input>
                        </td>
                        <td>
                            反馈要求类别：
                            <Radio.Group
                                onChange={e => formContext?.setValue('fkyqlb', e.target.value)}
                                value={formContext?.watch('fkyqlb')}>
                                <Radio value={"无反馈"}>无反馈</Radio>
                                <Radio value={"办理情况"}>办理情况</Radio>
                                <Radio value={"业务数据"}>业务数据</Radio>
                            </Radio.Group>
                        </td>
                    </tr>

                    <tr>
                        <td>
                            是否上级部门来文：
                            <Radio.Group
                                onChange={e => formContext?.setValue('sfsjbmlw', e.target.value)}
                                value={formContext?.watch('sfsjbmlw')}>
                                <Radio value={"是"}>是</Radio>
                                <Radio value={"否"}>否</Radio>
                            </Radio.Group>
                        </td>
                        <td>
                            {formContext?.watch('sfsjbmlw') === '是' && <>
                                上级来文单位类型：
                                <Select style={{ width: 120 }}
                                    value={formContext?.watch('comUnit')}>
                                    {comUnits.map(e => {
                                        return <Option value={e} key={e}>{e}</Option>
                                    })}
                                </Select></>}
                        </td>
                        <td></td>
                    </tr>
                </tbody>
            </table>

            <Form.Item label="标题" required>
                <TextArea
                    autoSize={{ minRows: 2 }}
                    value={formContext?.watch('title')}
                    onChange={e => formContext?.setValue('title', e.target.value)} />
            </Form.Item>


            <Form.Item label="主送机关" required>
                {selectedUnitKeys.map(e => {
                    return <Tag key={e}>{e}</Tag>
                })}

                <Button onClick={unitsDlgVisual.Toggle}>选择单位</Button>

                <RecvDialog></RecvDialog>
            </Form.Item>

            <Form.Item label="附件列表">
                <FormAttachmentsPreviewBox />
                {isOpenApp === false ? <Button type='primary' onClick={makeDoc}>点击生成标准的公文交换文件pdf和ofd并盖章</Button> : <>打开中...</>}

                <Button type="link"
                    onClick={() => window.open('http://oa.zwovo.xyz:5000/chfs/shared/winforms/gwjh/publish.html')}>下载公文交换程序</Button>
            </Form.Item>
        </Form>
    </div>)
}


const ReadOnlyForm = () => {
    const formContext = useContext(FormContext)
    return <div>
        <Form>
            <table className="table table-bordered table-bordered-danger">
                <tbody>
                    <tr>
                        <td>
                            文件类型：
                            <Select style={{ width: 100 }}
                                value={formContext?.watch('fileType')}
                                onChange={e => formContext?.setValue('fileType', e)}>
                                {fileTypes.map(e => {
                                    return <Option key={e} value={e}>{e}</Option>
                                })}
                            </Select>
                        </td>

                        <td>
                            办理等级：
                            {formContext?.watch('fileType') === '办件' && <Select style={{ width: 200 }}
                                value={formContext?.watch('emergencyLevel')}
                            >
                                {banjianEmergencyLevels.map(e => {
                                    return <Option key={e.name}
                                        value={e.name}>{e.name}</Option>
                                })}
                            </Select>}

                            {formContext?.watch('fileType') === '阅件' && <Select style={{ width: 200 }}
                                value={formContext?.watch('emergencyLevel')}
                                onChange={e => formContext?.setValue('emergencyLevel', e)}>
                                {yuejianEmergencyLevels.map(e => {
                                    return <Option
                                        key={e.name}
                                        value={e.name}>{e.name}</Option>
                                })}
                            </Select>}
                        </td>

                        <td>
                            发文机关：
                            <Input value={"自治区市监局"} style={{ width: 120 }}></Input>
                        </td>
                    </tr>

                    <tr>
                        <td>
                            签发人：
                            <Input value={formContext?.watch('leaderName')}
                                style={{ width: 120 }}
                            />
                        </td>

                        <td>
                            联系电话：
                            <Input
                                value={formContext?.watch('tel')}
                                style={{ width: 120 }} />
                        </td>
                        <td>
                            印发机关：
                            <Input
                                value={formContext?.watch('yfjg')}
                                onChange={e => formContext?.setValue('yfjg', e.target.value)}
                                style={{ width: 150 }} />
                        </td>
                    </tr>

                    <tr>
                        <td>
                            成文日期：
                            <Input type='text' value={formContext?.watch('cwrq')}
                                onChange={e => formContext?.setValue('cwrq', e.target.value)}
                                style={{ width: 120 }} />

                        </td>

                        <td>
                            印发日期：
                            <Input type='text' value={formContext?.watch('yfrq')}
                                onChange={e => formContext?.setValue('yfrq', e.target.value)}
                                style={{ width: 120 }} />
                        </td>

                        <td>
                            份号：
                            <Input type='number' value={formContext?.watch('fh')}
                                onChange={e => formContext?.setValue('fh', e.target.value)} style={{ width: 50 }} />

                        </td>
                    </tr>

                    <tr>
                        <td>
                            办结时间限制： (<Input
                                type='number'
                                value={formContext?.watch('days')}
                                onChange={formContext?.watch('emergencyLevel') === "其他类型" ? (e) => formContext.setValue('days', e.target.value) : undefined}
                                style={{ width: 80 }} />)(请填写数字)
                        </td>
                        <td>
                            要求办结时间：
                            <Input style={{ width: 120 }}
                                value={formContext?.watch('endDate')}></Input>
                        </td>
                        <td>
                            反馈要求类别：
                            <Radio.Group
                                onChange={e => formContext?.setValue('fkyqlb', e.target.value)}
                                value={formContext?.watch('fkyqlb')}>
                                <Radio value={"无反馈"}>无反馈</Radio>
                                <Radio value={"办理情况"}>办理情况</Radio>
                                <Radio value={"业务数据"}>业务数据</Radio>
                            </Radio.Group>
                        </td>
                    </tr>

                    <tr>
                        <td>
                            是否上级部门来文：
                            <Radio.Group
                                onChange={e => formContext?.setValue('sfsjbmlw', e.target.value)}
                                value={formContext?.watch('sfsjbmlw')}>
                                <Radio value={"是"}>是</Radio>
                                <Radio value={"否"}>否</Radio>
                            </Radio.Group>
                        </td>
                        <td>
                            {formContext?.watch('sfsjbmlw') === '是' && <>
                                上级来文单位类型：
                                <Select style={{ width: 120 }}
                                    value={formContext?.watch('comUnit')}>
                                    {comUnits.map(e => {
                                        return <Option value={e} key={e}>{e}</Option>
                                    })}
                                </Select></>}
                        </td>
                        <td></td>
                    </tr>
                </tbody>
            </table>

            <Form.Item label="标题">
                <TextArea
                    autoSize={{ minRows: 2 }}
                    value={formContext?.watch('title')}
                    onChange={e => formContext?.setValue('title', e.target.value)} />
            </Form.Item>


            <Form.Item label="主送机关">

            </Form.Item>

            <Form.Item label="附件列表">
                <FormAttachmentsPreviewBox hideEditStatus={true} />
            </Form.Item>
        </Form>
    </div>
}