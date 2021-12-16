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

const defalutTool = "火车高铁"
export default () => {
    const onloadTaskSuccessAfter = (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => {
        if (task.canEditForm === true && task.isJustCreated) {
            if (formFields.get('name') === undefined) {
                formFields.set('name', user.name ?? '')
            }

            if (formFields.get('title') === undefined) {
                formFields.set('title', new Date().toLocaleDateString() + ' 的工作安排')
            }
        }
    }

    const userTask = useTask({ onloadTaskSuccessAfter: onloadTaskSuccessAfter })
    return <FormContext.Provider value={userTask}>
        <FormPage>
            <div>
                <div className="text-center">
                    <h3 className="text-red"><b>日常工作安排</b></h3>
                    <div className="text-right">
                        <label style={{ color: '#0000ee', fontSize: 16 }}>流程状态：
                            <u>
                                {userTask?.task?.value?.activityName === "COMPLETED" ? "结束" : userTask?.task?.value?.activityName}
                            </u>
                        </label>
                    </div>
                </div>

                <div>
                    {userTask?.task?.value?.canEditForm === true ? <EditForm /> : <EditForm />}
                </div>
            </div >
        </FormPage>
    </FormContext.Provider>
}

const EditForm = () => {
    const formContext = useContext(FormContext)

    return <div>
        <table className="table text-left table-borderless" style={{ border: 0 }} cellSpacing={"0"} cellPadding="0">
            <thead>
                <tr style={{ border: 0 }}>
                    <td style={{ width: 150 }} className="text-right">
                        <b>发起人</b>
                    </td>
                    <td>
                        <TextArea autoSize
                            value={formContext?.watch('name')}
                            onChange={e => formContext?.setValue('name', e.target.value)} />
                    </td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="text-right"><b>标题</b></td>
                    <td>
                        <TextArea autoSize={{ minRows: 2 }}
                            value={formContext?.watch('title')}
                            onChange={e => formContext?.setValue('title', e.target.value)} />
                    </td>
                </tr>

                <tr>
                    <td className="text-right"><b>具体工作内容描述</b></td>
                    <td>
                        <TextArea autoSize={{ minRows: 2 }}
                            value={formContext?.watch('desc')}
                            onChange={e => formContext?.setValue('desc', e.target.value)} />
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