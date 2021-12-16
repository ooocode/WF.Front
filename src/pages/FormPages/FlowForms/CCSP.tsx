import { Button, Checkbox, DatePicker, Input, Space } from "antd";
import TextArea from "antd/lib/input/TextArea";
import produce from "immer";
import React, { useContext, useEffect, useState } from "react";
import { lookTaskMode } from "../../../Commmon/task";
import { CheckboxGroup } from "../../../components/CheckboxGroup";
import { FormContext, FormFieldKeyType, useTask } from "../../../hooks/useTask";
import { FormDetailViewModel, TodoTaskViewModel, UserReply } from "../../../WorkFlowApi";
import FormPage from "../../../components/FormPage";
import 'moment/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';
import moment from "moment";
import { FormAttachmentsPreviewBox } from "../../../components/FormAttachmentsPreviewBox";
import { StringUtils } from "../../../Commmon/consts";

const defalutTool = "火车高铁"
export default () => {
    const onloadTaskSuccessAfter = (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => {
        if (task.canEditForm === true && task.isJustCreated) {

            if (StringUtils.isNullOrEmpty(formFields.get('name'))) {
                formFields.set('name', user.name ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('unit'))) {
                formFields.set('unit', user.mainDepatment?.replace('区市监局/', '') ?? '')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('personCounts'))) {
                formFields.set('personCounts', '1')
            }

            if (StringUtils.isNullOrEmpty(formFields.get('ccfs'))) {
                formFields.set('ccfs', defalutTool)
            }

            var nowDate = new Date().toLocaleDateString()
            var nextDate = new Date(new Date().getTime() + 1 * (1000 * 60 * 60 * 24)).toLocaleDateString()
            if (StringUtils.isNullOrEmpty(formFields.get('beginDate'))) {
                formFields.set('beginDate', nowDate)
            }

            if (StringUtils.isNullOrEmpty(formFields.get('endDate'))) {
                formFields.set('endDate', nextDate)
            }
        }
    }

    const userTask = useTask({ onloadTaskSuccessAfter: onloadTaskSuccessAfter })
    return <FormContext.Provider value={userTask}>
        <FormPage>
            <div>
                <div className="text-center">
                    <h3 className="text-red"><b>自治区市场监管局人员出差（离邕）审批事项</b></h3>
                    <div className="text-right">
                        <label style={{ color: '#0000ee', fontSize: 16 }}>流程状态：
                            <u>
                                {userTask?.task?.value?.activityName === "COMPLETED" ? "结束" : userTask?.task?.value?.activityName}
                            </u>
                        </label>
                    </div>
                </div>

                <div>
                    {userTask?.task?.value?.canEditForm === true ? <EditForm /> : <ReadOnlyForm />}
                </div>
            </div >
        </FormPage>
    </FormContext.Provider>
}

const EditForm = () => {
    const formContext = useContext(FormContext)
    const [tools, setTools] = useState<string[]>([defalutTool])
    const [otherToolChecked, setOtherToolChecked] = useState<boolean>(false)
    const [otherTool, setOtherTool] = useState<string>('')

    const toolCheckboxOnChange = (value: string, checked: boolean) => {
        var newState: string[]
        if (checked) {
            newState = produce(tools, next => {
                next.push(value)
            })
        } else {
            newState = produce(tools, next => {
                var index = next.findIndex(e => e == value)
                if (index !== -1) {
                    next = next.splice(index, 1)
                }
            })
        }
        setTools(newState)
        var str = newState.join('、')
        formContext?.setValue('ccfs', str)
        setOtherToolChecked(false)
    }

    return <div>
        <table className="table text-left table-borderless" style={{ border: 0 }} cellSpacing={"0"} cellPadding="0">
            <thead>
                <tr style={{ border: 0 }}>
                    <td style={{ width: 150 }} className="text-right">
                        <b>单&nbsp;&nbsp;位</b>
                    </td>
                    <td>
                        <TextArea autoSize
                            value={formContext?.watch('unit')}
                            onChange={e => formContext?.setValue('unit', e.target.value)} />
                    </td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="text-right"><b>姓&nbsp;&nbsp;名</b></td>
                    <td>
                        <TextArea
                            autoSize
                            value={formContext?.watch('name')}
                            onChange={e => formContext?.setValue('name', e.target.value)} />
                    </td>
                </tr>

                <tr>
                    <td className="text-right"><b>人&nbsp;&nbsp;数</b></td>
                    <td>
                        {
                            <Input type='number'
                                value={formContext?.watch('personCounts')}
                                onChange={e => formContext?.setValue('personCounts', e.target.value)}
                                style={{ width: 80 }} />
                        }
                    </td>
                </tr>


                <tr>
                    <td className="text-right"><b>出差离邕事由</b></td>
                    <td>
                        <TextArea autoSize={{ minRows: 2 }}
                            value={formContext?.watch('title')}
                            onChange={e => formContext?.setValue('title', e.target.value)} />
                    </td>
                </tr>

                <tr>
                    <td className="text-right"><b>出差离邕时间</b></td>
                    <td>
                        <Space>
                            <DatePicker value={formContext?.watch('beginDate') ? moment(formContext?.watch('beginDate')) : undefined}
                                onChange={e => formContext?.setValue('beginDate', e?.toString() ?? '')}
                                locale={locale} />
                            至
                            <DatePicker
                                value={formContext?.watch('endDate') ? moment(formContext?.watch('endDate')) : undefined}
                                onChange={e => formContext?.setValue('endDate', e?.toString() ?? '')}
                                locale={locale} />
                        </Space>
                    </td>
                </tr>

                <tr>
                    <td className="text-right"><b>出差路线</b></td>
                    <td>
                        <TextArea autoSize
                            placeholder='例如：南宁—北京—南宁'
                            value={formContext?.watch('ccxl')}
                            onChange={e => formContext?.setValue('ccxl', e.target.value)} />
                    </td>
                </tr>

                <tr>
                    <td className="text-right"><b>出行方式(可多选)</b></td>
                    <td>
                        <CheckboxGroup
                            allValues={["火车高铁", "单位用车", "飞机", "租车", "自驾车"]}
                            checkedValues={tools}
                            onChange={toolCheckboxOnChange}
                        /> <br />

                        <Checkbox checked={otherToolChecked}
                            onChange={e => { setOtherToolChecked(e.target.checked); if (e.target.checked) { formContext?.setValue('ccfs', otherTool); setTools([]); } }}>其他方式(自填)</Checkbox>
                        <Input style={{ width: '100%' }} value={otherTool}
                            onChange={(e) => { setOtherTool(e.target.value); formContext?.setValue('ccfs', e.target.value); setTools([]); setOtherToolChecked(true) }} />

                        {/*    <br /> <br />
                        <label>您选择的出行方式是：{formContext.watch('ccfs')}</label> */}
                    </td>
                </tr>

                <tr>
                    <td className="text-right"><b>备&nbsp;&nbsp;注</b></td>
                    <td>
                        <TextArea autoSize
                            value={formContext?.watch('remark')}
                            onChange={e => formContext?.setValue('remark', e.target.value)} />
                    </td>
                </tr>

                <tr>
                    <td className="text-right"><b>附&nbsp;&nbsp;件</b></td>
                    <td>
                        <FormAttachmentsPreviewBox />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}

const ReadOnlyForm = () => {
    const formContext = useContext(FormContext)

    return <div className="table-d">
        <table className="table text-left"
            style={{ border: 0 }} cellSpacing={0} cellPadding={0}>
            <tbody>
                <tr>
                    <td style={{ width: 160 }} className="text-center">
                        <span className="text-red font-kt">单&nbsp;&nbsp;位</span>
                    </td>

                    <td>
                        {formContext?.watch('unit')}
                    </td>

                    <td style={{ width: 80 }} className="text-center">
                        <span className="text-red font-kt">人&nbsp;&nbsp;数</span>
                    </td>

                    <td style={{ width: 80 }}>
                        {formContext?.watch('personCounts')}
                    </td>
                </tr>

                <tr>
                    <td className="text-center">
                        <span className="text-red font-kt">姓&nbsp;&nbsp;名</span>
                    </td>

                    <td colSpan={3}>
                        {formContext?.watch('name')}
                    </td>
                </tr>

                <tr>
                    <td className="text-center">
                        <span className="text-red font-kt">
                            出差离邕事由
                        </span>
                    </td>

                    <td colSpan={3}>
                        {formContext?.watch('title')}
                    </td>
                </tr>

                <tr>
                    <td className="text-center">
                        <span className="text-red font-kt">
                            出差离邕时间
                        </span>
                    </td>

                    <td colSpan={3}>
                        {moment(formContext?.watch('beginDate'))?.toDate()?.toLocaleDateString()}&nbsp;
                        至&nbsp;{moment(formContext?.watch('endDate'))?.toDate()?.toLocaleDateString()}
                    </td>
                </tr>
                <tr>
                    <td style={{ width: 150 }} className="text-center">
                        <span className="text-red font-kt">
                            出差路线
                        </span>
                    </td>
                    <td>
                        {formContext?.watch('ccxl')}
                    </td>

                    <td style={{ width: 150 }} className="text-center">
                        <span className="text-red font-kt">
                            出行方式
                        </span>
                    </td>

                    <td style={{ width: 200 }}>
                        {formContext?.watch('ccfs')}
                    </td>
                </tr>

                <tr>
                    <td className="text-center">
                        <span className="text-red font-kt">
                            备&nbsp;&nbsp;注
                        </span>
                    </td>
                    <td colSpan={3}>
                        {formContext?.watch('remark')}
                    </td>
                </tr>

                {
                    formContext?.opinions?.value?.map(type => {
                        return <tr key={type.opinionType?.id}>
                            <td className="text-center">
                                <span className="text-red font-kt">
                                    {(type?.opinionType?.displayName?.trim()?.length ?? 0) > 0 ? type.opinionType?.displayName : type.opinionType?.name}
                                </span>
                            </td>
                            <td colSpan={3}>
                                <div>
                                    {
                                        type?.opinionItems?.map(opt => {
                                            return <span key={opt.opinion?.id}
                                                style={{ wordBreak: 'break-word' }}>
                                                {opt.opinion?.text}〔{opt.user?.name} {opt.formatDateTime}〕<br />
                                            </span>
                                        })
                                    }
                                </div>
                            </td>
                        </tr>
                    })
                }

                <tr>
                    <td className="text-center">
                        <span className="text-red font-kt">
                            附&nbsp;&nbsp;件
                        </span>
                    </td>
                    <td colSpan={3}>
                        <FormAttachmentsPreviewBox />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
}