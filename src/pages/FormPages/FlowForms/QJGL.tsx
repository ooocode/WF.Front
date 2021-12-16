import { Button, Checkbox, Col, Form, Input, notification, Radio, Row, Select, Space, Tag } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { FormContext, FormFieldKeyType, useTask } from "../../../hooks/useTask";
import FormPage from "../../../components/FormPage";
import { FormDetailViewModel, TodoTaskViewModel, UserReply } from "../../../WorkFlowApi";
import { lookTaskMode } from "../../../Commmon/task";
import TextArea from "antd/lib/input/TextArea";
const { Option } = Select
import { DatePicker } from 'antd';
import moment from "moment";
import { FormAttachmentsPreviewBox } from "../../../components/FormAttachmentsPreviewBox";
import { useForm } from "react-hook-form";
import { StringUtils } from "../../../Commmon/consts";

const { RangePicker } = DatePicker;

//const title = '请（休）假审批表'
const title = '自治区市场监管局工作人员请（休）假审批表'
const levels = ["普通", "一般"]
const emergencyLevels = ["一般", "急", "特急"]
const types = ["带薪年休假", "病假", "事假", "产假", "护理假", "探亲假", "婚假", "丧假", "其他"]


export default () => {
    const onloadTaskSuccessAfter = (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => {
        if (mode === 'todo' && task.isJustCreated) {
            if (StringUtils.isNullOrEmpty(formFields.get('name'))) {
                formFields.set('name', (user?.name ?? '') + ' ' + user.phoneNumber)
            }

            if (StringUtils.isNullOrEmpty(formFields.get('tel'))) {
                formFields.set('tel', user?.name + ' ' + user?.phoneNumber)
            }
            if (StringUtils.isNullOrEmpty(formFields.get('level'))) {
                formFields.set('level', levels[0])
            }

            if (StringUtils.isNullOrEmpty(formFields.get('emergencyLevel'))) {
                formFields.set('emergencyLevel', emergencyLevels[0])
            }

            if (StringUtils.isNullOrEmpty(formFields.get('unit'))) {
                formFields.set('unit', user.mainDepatment?.split('/')?.reverse()[0] ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('qjlx'))) {
                formFields.set('qjlx', types[0])
            }

            if (StringUtils.isNullOrEmpty(formFields.get('职务'))) {
                let job = user.departmentJob ?? ''
                if (job === "0") {
                    job = ""
                }
                formFields.set('职务', job)
            }

            if (StringUtils.isNullOrEmpty(formFields.get('参加工作时间'))) {
                formFields.set('参加工作时间', user.startWorkDateFormat ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('休假年度'))) {
                formFields.set('休假年度', new Date().getFullYear().toString())
            }
        }
    }

    const formContext = useTask({ onloadTaskSuccessAfter: onloadTaskSuccessAfter })

    return <FormContext.Provider value={formContext}>
        <FormPage>
            <div className="text-center">
                <h3 className="text-red"><b>{title}</b></h3>

                <div className="text-right">
                    <label style={{ color: '#0000ee', fontSize: 16 }}>流程状态：<u>{formContext?.task?.value?.activityName}</u></label>
                </div>
            </div>

            {formContext.task?.value?.canEditForm === true ? <EditForm /> : <ReadOnlyForm />}
        </FormPage>
    </FormContext.Provider>
}



const EditForm = () => {
    const formContext = useContext(FormContext)
    const [years, setYears] = useState<string[]>([])

    const [between] = useState(() => {
        const now = new Date()
        var month = now.getMonth() + 1
        var days = now.getDate()
        var h = now.getHours()
        var m = now.getMinutes()

        return month === 7 && days >= 14 && days <= 28 && h < 21 && m < 10
    })

    useEffect(() => {
        let date = new Date()
        let curYear = date.getFullYear()
        if (date.getMonth() <= 3 && date.getDay() < 31) {
            setYears([curYear.toString(), (curYear - 1).toString()])
        } else {
            setYears([curYear.toString()])
        }
    }, [])

    useEffect(() => {
        formContext?.setValue('jzgxsjd', "1")
    }, [formContext?.watch('sfjzgx')])

    useEffect(() => {
        if (formContext?.watch('sfjzgx') === '是') {
            if (formContext?.watch('jzgxsjd') === "1") {
                formContext.setValue('beginDate', "2021-08-01")
                formContext.setValue('endDate', "2021-08-10")
            }

            if (formContext?.watch('jzgxsjd') === "2") {
                formContext.setValue('beginDate', "2021-08-11")
                formContext.setValue('endDate', "2021-08-20")
            }
        }
    }, [formContext?.watch('jzgxsjd'), formContext?.watch('sfjzgx')])


    useEffect(() => {
        if (formContext) {
            var date1 = new Date(formContext.watch('beginDate') ?? '')
            var date2 = new Date(formContext.watch('endDate') ?? '')

            var s1 = date1.getTime(), s2 = date2.getTime();
            var total = (s2 - s1) / 1000;
            var day = total / (24 * 60 * 60);//计算整数天数

            day = day + 1
            formContext.setValue('days', day.toString())
        }

    }, [formContext?.watch('beginDate'), formContext?.watch('endDate')])


    const onChangeBeginDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        var begin = new Date(e.target.value)
        var end = new Date(formContext?.watch('endDate') ?? '')

        if (begin > end) {
            notification.error({ message: '请休假结束时间不能早于开始时间' })
            return
        }

        formContext?.setValue('beginDate', e.target.value)
    }

    const onChangeEndDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        var begin = new Date(formContext?.watch('beginDate') ?? '')
        var end = new Date(e.target.value)

        if (begin > end) {
            notification.error({ message: '请休假结束时间不能早于开始时间' })
            return
        }

        formContext?.setValue('endDate', e.target.value.toString())
    }


    return (<div>
        <Form labelCol={{ span: 7 }}>
            <div>
                <table className="table text-left"
                    style={{ border: 0 }} cellSpacing={0} cellPadding={0}>
                    <tbody>
                        <tr>
                            <td>
                                <Form.Item label="姓名" required>
                                    <Input value={formContext?.watch('name')}
                                        onChange={e => formContext?.setValue('name', e.target.value)} />
                                </Form.Item>

                                <Form.Item label="休假类型" required>
                                    <Select
                                        value={formContext?.watch('qjlx')}
                                        onChange={e => formContext?.setValue('qjlx', e)}
                                        style={{ width: 120 }}>
                                        {types.map(e => {
                                            return <Option key={e} value={e}>{e}</Option>
                                        })}
                                    </Select>
                                </Form.Item>
                            </td>
                            <td>
                                <Form.Item label="处室(单位)" required>
                                    <Input value={formContext?.watch('unit')}
                                        onChange={e => formContext?.setValue('unit', e.target.value)} />
                                </Form.Item>

                                {formContext?.watch('qjlx') === '带薪年休假' ? <Form.Item label="参加工作时间" required>
                                    <Input value={formContext?.watch('参加工作时间')}
                                        onChange={e => formContext?.setValue('参加工作时间', e.target.value)}></Input>
                                </Form.Item> : <></>}
                            </td>
                            <td>
                                <Form.Item label="职务职级" required>
                                    <Input value={formContext?.watch('职务')}
                                        onChange={e => formContext?.setValue('职务', e.target.value)} ></Input>
                                </Form.Item>

                                {formContext?.watch('qjlx') === '带薪年休假' ? <Form.Item label="休假年度">
                                    <Select
                                        value={formContext?.watch('休假年度')}
                                        onChange={e => formContext?.setValue('休假年度', e)}
                                        style={{ width: 120 }}>
                                        {years.map(e => {
                                            return <Option key={e} value={e}>{e}</Option>
                                        })}
                                    </Select>
                                </Form.Item> : <></>}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Form>

        <Form>
            <Form.Item label="起止时间、天数" required>
                <>
                    <Input type='date' value={formContext?.watch('beginDate')}
                        onChange={onChangeBeginDate} style={{ width: 150 }} />至
                    <Input type='date' value={formContext?.watch('endDate')}
                        onChange={onChangeEndDate} style={{ width: 150 }} />
                    ，共计
                    <Input type='number' value={formContext?.watch('days')}
                        onChange={e => formContext?.setValue('days', e.target.value)} style={{ width: 60 }} />天
                </>



                {between === true && formContext?.watch('qjlx') === '带薪年休假' && <Checkbox
                    style={{ marginLeft: 20 }}
                    checked={formContext?.watch('sfjzgx') === "是"}
                    onChange={e => {
                        formContext?.setValue('sfjzgx', e.target.checked ? '是' : '否');

                    }}>
                    是否集中公休
                </Checkbox>}

                {formContext?.watch('qjlx') === '带薪年休假' && formContext?.watch('sfjzgx') === "是" && <>
                    <Radio.Group value={formContext.watch('jzgxsjd')}
                        onChange={e => formContext.setValue('jzgxsjd', e.target.value)}>
                        <Space direction="vertical">
                            <Radio value={"1"}>
                                第一批：8月1日-8月10日
                            </Radio>

                            <Radio value={"2"}>
                                第二批：8月11日-8月20日
                            </Radio>
                        </Space>
                    </Radio.Group>
                </>}

            </Form.Item>

            <Form.Item label="请（休）假事由" required>
                <TextArea autoSize={{ minRows: 2 }}
                    value={formContext?.watch('title')}
                    onChange={e => formContext?.setValue('title', e.target.value)} />
            </Form.Item>

            <Form.Item label="请（休）假去向" required>
                <TextArea autoSize={{ minRows: 2 }}
                    value={formContext?.watch('qjqx')}
                    onChange={e => formContext?.setValue('qjqx', e.target.value)} />
            </Form.Item>

            <Form.Item label="请（休）假证明材料">
                <FormAttachmentsPreviewBox />
            </Form.Item>
        </Form>
    </div>)
}


const ReadOnlyForm = () => {
    const formContext = useContext(FormContext)
    return <div>
        <div className="table-d">
            <table className="table table-bordered text-left">
                <tbody>
                    <tr>
                        <td className="text-red" style={{ width: 180 }}>姓名</td>
                        <td>{formContext?.watch('name')}</td>
                        <td className="text-red" style={{ width: 120 }}>处室(单位)</td>
                        <td style={{ width: 200 }}>{formContext?.watch('unit')}</td>
                        <td className="text-red" style={{ width: 120 }}>职务职级</td>
                        <td>{formContext?.watch('职务')}</td>
                    </tr>

                    <tr>
                        <td className="text-red">参加工作时间</td>
                        <td>{formContext?.watch('参加工作时间')}</td>
                        <td className="text-red">休假类型</td>
                        <td>{formContext?.watch('qjlx')}</td>
                        <td className="text-red">休假年度</td>
                        <td>{formContext?.watch('休假年度')}</td>
                    </tr>

                    <tr>
                        <td className="text-red">起止时间、天数</td>
                        <td colSpan={5}>
                            {formContext?.watch('beginDate')}至{formContext?.watch('endDate')}，共计{formContext?.watch('days')}天
                            {formContext?.watch('sfjzgx') === "是" && <>
                                &nbsp;&nbsp;【参加集体公休假第{formContext.watch('jzgxsjd')}批】
                            </>}
                        </td>
                    </tr>

                    <tr>
                        <td className="text-red">请（休）假事由</td>
                        <td colSpan={5}>{formContext?.watch('title')}</td>
                    </tr>

                    <tr>
                        <td className="text-red">请（休）假去向</td>
                        <td colSpan={5}>{formContext?.watch('qjqx')}</td>
                    </tr>

                    <tr>
                        <td className="text-red">
                            请（休）假证明材料
                        </td>
                        <td colSpan={5}>
                            <FormAttachmentsPreviewBox></FormAttachmentsPreviewBox>
                        </td>
                    </tr>


                    {/*  <tr>
                        <td className="text-red">
                            请(休)假审批权限及流程
                        </td>
                        <td colSpan={5}>
                            <p>
                                一、局管二级巡视员<br />
                    个人申请→人事处审核→局主要领导审批。<br />
                    二、处室、直属单位党政主要负责人、正处长级干部<br />
                    个人申请→人事处审核→分管局领导意见→局主要领导审批。<br />
                    三、局机关、直属单位副处长级干部，局机关、直属行政机构一至四级调研员（不担任处级领导职务），局机关、直属行政机构、服务中心、信息中心、消保中心（消委会秘书处）、研究所、投诉举报中心一级主任科员及以下工作人员<br />
                    个人申请→人事处审核→处室（单位）主要负责人意见→分管局领导审批。<br />
                    备注：<br />
                    1.请（休）假应履行申报手续，填写审批表,确因急事急病来不及办理请（休）假手续的，应在请(休)假前按审批权限向对应的领导口头报告,同时告知人事部门,原则上在请（休）假开始的3天内补办手续；<br />
                    2.请（休）假结束后，应在2天内销假，并通过OA系统送人事处备案；<br />
                    3.休产假、男方护理假（生育子女），须提供医疗机构出具的生育相关证明；<br />
                    4.休护理父母假，须提供独生子女相关证明、医疗机构出具的父母住院证明；<br />
                    5.请病假，需提供医疗机构证明，无法提供医疗机构证明的，算事假；<br />
                    6.年内请事假需先用完公休假后再请事假。<br />
                            </p>
                        </td>
                    </tr>
 */}
                    {/* {
                        formContext?.opinions?.map(type => {
                            return <tr key={type.opinionType?.id}>
                                <td>
                                    <span className="text-red">
                                        {(type?.opinionType?.displayName?.trim()?.length ?? 0) > 0 ? type.opinionType?.displayName : type.opinionType?.name}
                                    </span>
                                </td>
                                <td colSpan={7}>
                                    <div>
                                        {
                                            type?.opinionItems?.map(opt => {
                                                return <span key={opt.opinion?.id}
                                                    style={{ wordBreak: 'break-word' }}>
                                                    {opt.opinion?.text} ({opt.user?.name} {opt.formatDateTime})<br />
                                                </span>
                                            })
                                        }
                                    </div>
                                </td>
                            </tr>
                        })
                    } */}
                </tbody>
            </table>
        </div>
    </div>
}