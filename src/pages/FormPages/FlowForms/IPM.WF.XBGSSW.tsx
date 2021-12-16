import { Checkbox, Col, Form, Input, message, Radio, Row, Space, Tag } from "antd";
import TextArea from "antd/lib/input/TextArea";
import React, { useContext, useState } from "react";
import { FormContext, FormFieldKeyType, useTask } from "../../../hooks/useTask";
import { Select } from 'antd';
import FormPage from "../../../components/FormPage";
import { FormDetailViewModel, UserReply, UsersOfDepartmentDto, UtilsClient } from "../../../WorkFlowApi";
import { useEffect } from "react";
import { lookTaskMode } from "../../../Commmon/task";
import { FormAttachmentsPreviewBox } from "../../../components/FormAttachmentsPreviewBox";
import { OpinionArea } from "../../../components/OpinionArea";
import { axiosClient, departmentsClient, usersClient, useUser } from "../../../hooks/useApi";
import { OpinionAreaBGSSW } from "../../../components/OpinionAreaBGSSW";
import MyDialog from "../../../components/MyDialog";
import { IuseToggleResult, useToggle } from "../../../hooks/useToggle";
import { useAsync, useBoolean } from "react-use";
import { Table, Divider } from 'antd';
import { ColumnsType } from "antd/lib/table";
import { TableRowSelection } from "antd/lib/table/interface";
import { FileProtectOutlined } from "@ant-design/icons";
import { useFormQueryString } from "../../../hooks/useFormQueryString";
import { StringUtils } from "../../../Commmon/consts";
const { Option } = Select;

interface IDealLevel {
    name: string
    days: number
}

const banjianEmergencyLevels: IDealLevel[] = [
    { name: '其他类型', days: 0 },
    { name: '特急件', days: 1 },
    { name: '加急件', days: 5 },
    { name: '普通一类', days: 12 },
    { name: '普通二类', days: 25 },
    { name: '普通三类', days: 110 },
    { name: '督办件', days: 999 }]

const yuejianEmergencyLevels = [
    { name: '特急件', days: 1 },
    { name: '加急件', days: 5 },
    { name: '普通', days: 10 }
]

const fileTypes = ['国家级文件', '会签文件', '各地市文件', '会议通知', '本局文件', '自治区级文件', '征求意见文件', '其他']
const comArchTypes = ['区内来文', '国家部委', '自治区党委', '中办国办', '其他']
const archTypes = ['办件', '阅件']
const title = '广西壮族自治区市场监督管理局公文处理笺'

//const title = ''
export default () => {
    const onloadTaskSuccessAfter = (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => {
        if (task.canEditForm === true && task.isJustCreated) {
            if (StringUtils.isNullOrEmpty(formFields.get('name'))) {
                formFields.set('name', user.name ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('unit'))) {
                formFields.set('unit', user.mainDepatment?.replace('区市监局/', '') ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('tel'))) {
                formFields.set('tel', user.phoneNumber ?? '')
            }

            var nowDate = new Date().toLocaleDateString()
            var now = new Date()
            if (StringUtils.isNullOrEmpty(formFields.get('date'))) {
                formFields.set('date', `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`)
            }

            var nextDate = new Date(new Date().getTime() + 1 * (1000 * 60 * 60 * 24)).toLocaleDateString()
            if (StringUtils.isNullOrEmpty(formFields.get('beginDate'))) {
                formFields.set('beginDate', nowDate)
            }

            if (StringUtils.isNullOrEmpty(formFields.get('endDate'))) {
                formFields.set('endDate', nextDate)
            }

            if (StringUtils.isNullOrEmpty(formFields.get('fileType'))) {
                formFields.set('fileType', '自治区级文件')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('comArchType'))) {
                formFields.set('comArchType', comArchTypes[0])
            }

            if (StringUtils.isNullOrEmpty(formFields.get('archType'))) {
                formFields.set('archType', archTypes[0])
            }
        }

        if (StringUtils.isNullOrEmpty(formFields.get('emergencyLevel'))) {
            formFields.set('emergencyLevel', banjianEmergencyLevels[3].name)
        }

        if (StringUtils.isNullOrEmpty(formFields.get('fileType'))) {
            formFields.set('fileType', '自治区级文件')
        }

        if (StringUtils.isNullOrEmpty(formFields.get('autoNumber'))) {
            formFields.set('autoNumber', task.form?.businessKey ?? '')
        }
    }

    const formContext = useTask({ onloadTaskSuccessAfter: onloadTaskSuccessAfter })
    const { prodefKey, mode } = useFormQueryString()
    const ccDlgVisual = useToggle()

    const Label = ({ title }: { title: string }) => {
        return <label className='text-danger' style={{ fontSize: 16 }}>{title}：</label>
    }

    useEffect(() => {
        if (mode === 'todo') {
            if (formContext?.watch('archType') === "办件") {
                formContext.setValue('emergencyLevel', banjianEmergencyLevels[3].name)
            } else {
                formContext?.setValue('emergencyLevel', yuejianEmergencyLevels[0].name)
            }
        }
    }, [formContext?.watch('archType')])


    const dealLeveOnChange = (name: string) => {
        if (formContext.task?.value?.canEditForm === true) {
            formContext.setValue('emergencyLevel', name)
        } else {
            message.error('无权限，不允许修改办理等级')
        }
    }

    useEffect(() => {
        if (mode === 'todo') {
            const emergencyLevel = formContext?.watch('emergencyLevel')
            if (formContext?.watch('archType') === '办件') {
                let days = banjianEmergencyLevels
                    .filter(e => e.name === emergencyLevel)[0]?.days?.toString() ?? '0'
                formContext.setValue('days', days)
            } else {
                let days = yuejianEmergencyLevels
                    .filter(e => e.name === emergencyLevel)[0]?.days?.toString() ?? '0'
                formContext?.setValue('days', days)
            }
        }
    }, [formContext?.watch('emergencyLevel')])

    useEffect(() => {
        if (mode === 'todo') {
            let days = formContext.watch('days') ?? '0'
            var endDate = new Date(new Date().getTime() + parseInt(days) * (1000 * 60 * 60 * 24))
            formContext.setValue('endDate', `${endDate.getFullYear()}/${endDate.getMonth() + 1}/${endDate.getDate()} ${endDate.getHours()}:${endDate.getMinutes()}`)
        }
    }, [formContext.watch('days')])

    const [checkedCC, setCheckedCC] = useBoolean(false)
    useEffect(() => {
        if (checkedCC) {
            ccDlgVisual.Toggle()
        } else {
            formContext.cc.current = ({ userNames: [], taskName: '' })
        }
    }, [checkedCC])

    const { userName } = useUser()

    const leaders = useAsync(async () => {
        if (userName) {
            let res = await departmentsClient.getDepartmentUsersByDepartmentName('区市监局/局领导')
            if (userName === 'lhl' || userName === 'john') {
                res.push(UsersOfDepartmentDto.fromJS({ user: { userName: 'john', name: 'john' } }))
                res.push(UsersOfDepartmentDto.fromJS({ user: { userName: 'lhl', name: '雷海玲' } }))
            }
            return res
        }
    }, [userName])

    const columns: ColumnsType<UsersOfDepartmentDto> = [{
        title: '',
        render: (e: UsersOfDepartmentDto) => e.user?.userName + ',' + e.user?.name
    }]

    const [selectedRows, setSelectedRows] = useState<UsersOfDepartmentDto[]>([])
    const onRowSelect = (selectedRowKeys: React.Key[], selectedRows: UsersOfDepartmentDto[]) => {
        setSelectedRows(selectedRows)
        if (checkedCC) {
            formContext.cc.current = ({ userNames: selectedRowKeys.map(e => e.toString()), taskName: '局领导阅' })
        } else {
            formContext.cc.current = ({ userNames: [], taskName: '' })
        }
    }


    return <FormContext.Provider value={formContext}>
        <FormPage>
            <div className="container-fluid">
                <div className="text-center">
                    <h3 className="text-red"><b>{title}</b></h3>
                    <div className="text-right">
                        <label style={{ color: '#0000ee', fontSize: 16 }}>
                            当前状态：
                            <u>
                                {formContext?.task?.value?.activityName === "COMPLETED" ? "结束" : formContext?.task?.value?.activityName}
                            </u>
                        </label>
                    </div>
                </div>

                <div className="p-3" style={{ border: '1px solid rgb(227,227,227)' }}>
                    <div>
                        <Row>
                            <Col span={8}>
                                <Space>
                                    <Label title="收文日期" />
                                    <Input type='text' value={formContext?.watch('date')}
                                        bordered={false}
                                        style={{ borderBottom: 'solid 1px red', fontSize: 16 }}
                                        onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('date', e.target.value)} />
                                </Space>
                            </Col>

                            <Col span={8}>
                                <Space>
                                    <Label title="编号" />
                                    <Input value={formContext?.watch('autoNumber')}
                                        bordered={false}
                                        style={{ borderBottom: 'solid 1px red', fontSize: 16 }}
                                        onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('autoNumber', e.target.value)} />
                                </Space>
                            </Col>

                            <Col span={8}>
                                <Space>
                                    <Label title="文件类型" />
                                    <Select
                                        bordered={false}
                                        style={{ borderBottom: 'solid 1px red', width: 150, fontSize: 16 }}
                                        value={formContext?.watch('fileType')}
                                        onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('fileType', e)} >
                                        {fileTypes.map(e => {
                                            return <Option value={e} key={e}>{e}</Option>
                                        })}
                                    </Select>
                                </Space>
                            </Col>
                        </Row>

                        <hr />

                        <Row>
                            <Col span={12}>
                                <Space>
                                    <Label title="公文类型" />
                                    <Select
                                        style={{ width: 100, fontSize: 16 }}
                                        value={formContext?.watch('archType')}
                                        onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('archType', e)}>
                                        {archTypes.map(e => {
                                            return <Option value={e} key={e}>{e}</Option>
                                        })}
                                    </Select>
                                </Space>
                            </Col>

                            <Col span={12}>
                                <Space>
                                    <Label title="上级来文类型" />
                                    <Select
                                        style={{ width: 120, fontSize: 16 }}
                                        value={formContext?.watch('comArchType')}
                                        onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('comArchType', e)}>
                                        {comArchTypes.map(e => {
                                            return <Option value={e} key={e}>{e}</Option>
                                        })}
                                    </Select>
                                </Space>
                            </Col>
                        </Row>
                        <hr />

                        <div>
                            <label className='text-danger' style={{ fontSize: 16 }}>按公文限时办结规定，主办单位须在要求办结时限内将来文反馈至办公室</label><br />
                            <Label title="是否抄送至办公厅限时系统" />
                            <Radio.Group
                                value={formContext.watch('是否抄送至办公厅限时系统')}
                                onChange={e => formContext.setValue('是否抄送至办公厅限时系统', e.target.value)}>
                                <Radio value="是">是</Radio>
                                <Radio value="否">否</Radio>
                            </Radio.Group>
                        </div>

                        <hr />

                        <div>
                            <Label title="办理等级" />
                            <Select
                                style={{ width: 120, fontSize: 16 }}
                                value={formContext?.watch('emergencyLevel')}
                                onChange={dealLeveOnChange}>
                                {formContext.watch('archType') === '办件' && banjianEmergencyLevels.map(e => {
                                    return <Option value={e.name} key={e.name}>{e.name}</Option>
                                })}

                                {formContext.watch('archType') === '阅件' && yuejianEmergencyLevels.map(e => {
                                    return <Option value={e.name} key={e.name}>{e.name}</Option>
                                })}
                            </Select>

                            <span style={{ marginLeft: 5 }}></span>
                            <Label title="办结时间限制" />
                            ({formContext.watch('emergencyLevel') !== '其他类型' && formContext.watch('emergencyLevel') !== '督办件' && <Input type='text'
                                bordered={formContext.task?.value?.canEditForm === true}
                                style={{ width: 55, fontSize: 16 }}
                                value={formContext.watch('days')}
                            />}
                            {(formContext.watch('emergencyLevel') === '其他类型' || formContext.watch('emergencyLevel') === '督办件') && <Input type='text'
                                bordered={formContext.task?.value?.canEditForm === true}
                                style={{ width: 55, fontSize: 16 }}
                                value={formContext.watch('days')}
                                onChange={e => formContext.setValue('days', e.target.value)}
                            />})
                            <span className="text-danger">个工作日，要求办结时间：<span style={{ color: 'black' }}>{formContext.watch('endDate')}</span></span>
                        </div>
                        <hr />

                        <Form>
                            <Form.Item
                                label={<Label title='来文单位' />}
                                colon={false}>
                                <Input
                                    style={{ width: 618, fontSize: 16 }}
                                    value={formContext?.watch('comUnit')}
                                    bordered={formContext.task?.value?.canEditForm === true}
                                    onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('comUnit', e.target.value)} />
                            </Form.Item>

                            <Form.Item
                                label={<Label title='文件名称' />}
                                colon={false}>
                                <TextArea
                                    style={{ width: 618, fontSize: 16 }}
                                    autoSize={{ minRows: ((formContext.task?.value?.canEditForm === true) ? 2 : 1) }}
                                    value={formContext?.watch('title')}
                                    bordered={formContext.task?.value?.canEditForm === true}
                                    onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('title', e.target.value)} />
                            </Form.Item>

                            <Form.Item
                                label={<Label title='来文文号' />}
                                colon={false}>
                                <Input
                                    style={{ width: 618, fontSize: 16 }}
                                    value={formContext?.watch('archNo')}
                                    bordered={formContext.task?.value?.canEditForm === true}
                                    onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('archNo', e.target.value)} />
                            </Form.Item>

                            <Form.Item
                                label={<Label title='内容摘抄' />}
                                colon={false}>
                                <TextArea
                                    autoSize={{ minRows: 3 }}
                                    style={{ width: 618, fontSize: 16 }}
                                    value={formContext?.watch('desc')}
                                    bordered={formContext.task?.value?.canEditForm === true}
                                    onChange={e => formContext.task?.value?.canEditForm === true && formContext?.setValue('desc', e.target.value)} />
                            </Form.Item>
                        </Form>
                        <hr />
                        <OpinionAreaBGSSW />

                        {mode === 'todo' && prodefKey === 'BGSSW'
                            && formContext.task.value?.activityName === '办公室收文员' && <div>
                                <Checkbox checked={checkedCC} onChange={e => setCheckedCC(e.target.checked)}>是否同时抄送至局领导</Checkbox>
                                {checkedCC && selectedRows.map(e => {
                                    return <Tag key={e.user?.userName}>{e.user?.name}</Tag>
                                })}

                                {checkedCC && selectedRows.length === 0 && ccDlgVisual.value === false && <label style={{ color: 'red' }}>错误警告：勾选了抄送局领导，但没有选择任何用户</label>}

                                <MyDialog title='选择抄送用户' open={ccDlgVisual.value} onClose={ccDlgVisual.Toggle}>
                                    <Table
                                        rowKey={e => e.user?.userName ?? ''}
                                        rowSelection={{ onChange: onRowSelect }}
                                        columns={columns}
                                        dataSource={leaders.value}
                                        loading={leaders.loading}
                                        pagination={{ pageSize: 100 }}
                                    />
                                </MyDialog>
                            </div>}
                    </div>
                </div>
            </div>
        </FormPage>
    </FormContext.Provider>
}
