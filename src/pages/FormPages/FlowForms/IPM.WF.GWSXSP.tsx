import { Button, Col, Form, Input, notification, Row, Select, Space } from "antd";
import React, { useContext, useEffect } from "react";
import { FormContext, FormFieldKeyType, useTask } from "../../../hooks/useTask";
import FormPage from "../../../components/FormPage";
import { FormDetailViewModel, TodoTaskViewModel, UserReply } from "../../../WorkFlowApi";
import { lookTaskMode } from "../../../Commmon/task";
import TextArea from "antd/lib/input/TextArea";
import { usersClient, useUser } from "../../../hooks/useApi";
import { FormAttachmentsPreviewBox } from "../../../components/FormAttachmentsPreviewBox";
import { Controller, FieldValues, useForm, UseFormSetValue } from "react-hook-form";
import { messageBox } from "../../../messageBox";
import produce from "immer";
import { useAsync } from "react-use";
import { StringUtils } from "../../../Commmon/consts";
const { Option } = Select

const levels = ["普通", "一般"]
const emergencyLevels = ["一般", "急", "特急"]
const title = "广西壮族自治区市场监督管理局呈批事项处理笺"
//const title = ''
export default () => {
    const onloadTaskSuccessAfter = (user: UserReply, task: FormDetailViewModel, formFields: Map<string, string>, mode: lookTaskMode) => {
        if (mode === 'todo' && task.canEditForm === true && task.isJustCreated) {
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

            {formContext.task?.value?.canEditForm === true && formContext.task.value?.isJustCreated === true ? <EditForm /> : <ReadOnlyForm />}
        </FormPage>
    </FormContext.Provider>
}

const EditForm = () => {
    const formContext = useContext(FormContext)

    return (<div>
        <form>
            <Space size='large'>
                <div>
                    <label className="text-danger">办理等级：</label>
                    <Controller
                        name='level'
                        control={formContext?.control}
                        rules={{ required: true }}
                        render={({ field }) => <Select
                            {...field}
                            style={{ width: 70 }} size='small'>
                            {levels.map(e => {
                                return <Option value={e} key={e}>{e}</Option>
                            })}
                        </Select>}
                    />
                </div>

                <div>
                    <label className="text-danger">缓急程度：</label>
                    <Controller
                        name='emergencyLevel'
                        control={formContext?.control}
                        rules={{ required: true }}
                        render={({ field }) => <Select
                            {...field}
                            style={{ width: 70 }} size='small'>
                            {emergencyLevels.map(e => {
                                return <Option value={e} key={e}>{e}</Option>
                            })}
                        </Select>}
                    />
                </div>


                <div>
                    <label className="text-danger">编号：</label>
                    <Controller
                        name='archNo'
                        control={formContext?.control}
                        render={({ field }) => <Input {...field} style={{ width: 200 }} />}
                    />
                </div>

                <div>
                    <label className="text-danger">联系方式：</label>
                    <Controller
                        name='tel'
                        control={formContext?.control}
                        rules={{
                            required: { value: true, message: '联系方式不能为空' }
                        }}
                        render={({ field }) => <>
                            <Input {...field} style={{ width: 200 }} />
                            {/*  {errors.tel && <label style={{ color: 'red' }}>{errors.tel.message}</label>} */}
                        </>}
                    />
                </div>
            </Space>


            <div>
                <table className="table table-bordered text-left">
                    <tbody>
                        <tr>
                            <td style={{ width: 200 }}>
                                <span className="text-danger">呈批单位</span>
                            </td>
                            <td>
                                <Controller
                                    name='unit'
                                    control={formContext?.control}
                                    rules={{
                                        required: { value: true, message: '单位不能为空' }
                                    }}
                                    render={({ field }) => <>
                                        <Input  {...field} />
                                        {/* {errors.unit && <label style={{ color: 'red' }}>{errors.unit.message}</label>} */}
                                    </>}
                                />
                            </td>
                        </tr>


                        <tr>
                            <td style={{ width: 150 }}>
                                <span className="text-danger"> 呈批事项(标题)</span>
                            </td>
                            <td>
                                <Controller
                                    name='title'
                                    control={formContext?.control}
                                    rules={{
                                        required: { value: true, message: '标题不能为空' }
                                    }}
                                    render={({ field }) => <>
                                        <TextArea autoSize={{ minRows: 2 }}  {...field} />
                                        {/* {errors.title && <label style={{ color: 'red' }}>{errors.title.message}</label>} */}
                                    </>}
                                />
                            </td>
                        </tr>


                        <tr>
                            <td style={{ width: 150 }}>
                                <span className="text-danger">期限</span>
                            </td>
                            <td>
                                <Controller
                                    name='date'
                                    control={formContext?.control}
                                    render={({ field }) => <Input type="date"  {...field} />}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div>
                <span className="text-danger">附件列表:</span>
                <FormAttachmentsPreviewBox />
            </div>
        </form>
    </div>)
}

const ReadOnlyForm = () => {
    const formContext = useContext(FormContext)
    return <div>
        <div className="row">
            <div className="col-3">
                <label className="text-danger">办理等级：</label>
                <label htmlFor="">{formContext?.watch('level')}</label>
            </div>

            <div className="col-3">
                <label className="text-danger">缓急程度：</label>
                <label htmlFor="">{formContext?.watch('emergencyLevel')}</label>
            </div>


            <div className="col-3">
                <label className="text-danger">编号：</label>
                <label htmlFor="">{formContext?.watch('archNo')}</label>
            </div>

            <div className="col-3">
                <label className="text-danger">联系方式：</label>
                <label htmlFor="">{formContext?.watch('tel')}</label>
            </div>
        </div>


        <div>
            <table className="table table-bordered text-left">
                <tbody>
                    <tr>
                        <td style={{ width: 200 }}>
                            <span className="text-danger">呈批单位</span>
                        </td>
                        <td>
                            <label>{formContext?.watch('unit')}</label>
                        </td>
                    </tr>


                    <tr>
                        <td style={{ width: 150 }}>
                            <span className="text-danger"> 呈批事项(标题)</span>
                        </td>
                        <td>
                            <label>{formContext?.watch('title')}</label>
                        </td>
                    </tr>


                    <tr>
                        <td style={{ width: 150 }}>
                            <span className="text-danger">期限</span>
                        </td>
                        <td>
                            <label>{formContext?.watch('date')}</label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div>
            <span className="text-danger">附件列表:</span>
            <FormAttachmentsPreviewBox hideEditStatus={true} />
        </div>
    </div>
}