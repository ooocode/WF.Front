
import { Button, Form, Input, message, notification, Radio, Space } from "antd";
import React, { useContext, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { FeedbackViewModel, IFeedbackViewModel, MakeCLQKMode } from "../../apis/GWExchange";
import { inboxClient, useUser } from "../hooks/useApi";
import { FormContext } from "../hooks/useTask";
import { messageBox } from "../messageBox";
import MyDialog from "./MyDialog";

const feedbackKey = "外单位来文回复处理情况"
const hadFeedbackKey = '外单位来文是否已经回复处理情况'
const hadFeedbackKeyYes = '是'
const hadFeedbackKeyNo = '否'

export default function FeedbackDlg() {
    const context = useContext(FormContext)

    const { reset, watch, control, handleSubmit, getValues } = useForm<IFeedbackViewModel>()
    const { userDisplayName, phoneNumber } = useUser()
    const submit = handleSubmit(data => {
        console.log(data)
        if (context?.watch(hadFeedbackKey) === hadFeedbackKeyYes) {
            notification.error({ message: '已经回复过处理情况了，不需要再回复' })
            return
        }

        inboxClient.inboxFeedback(FeedbackViewModel.fromJS(data)).then(res => {
            notification.success({ message: '反馈处理情况成功' })
            context?.setValue(hadFeedbackKey, hadFeedbackKeyYes)
            context?.setValue(feedbackKey, JSON.stringify(data))
        }).catch(err => messageBox(err))
    })

    useEffect(() => {
        if (context?.task.loading === false) {
            var value = context?.watch(feedbackKey)
            if (context?.watch(hadFeedbackKey) === hadFeedbackKeyYes && value) {
                var json = JSON.parse(value) as IFeedbackViewModel
                reset(json)
            } else {
                reset({
                    externalSystemBusinessKey: context.task.value?.form?.externalSystemBusinessKey,
                    userDisplayName: userDisplayName,
                    phoneNumber: phoneNumber,
                    reason: '',
                    makeCLQKMode: MakeCLQKMode.Completed
                })
            }
        }
    }, [context?.task.loading])


    return <MyDialog title="反馈情况"
        open={context?.feedbackModalVisual.value ?? false}
        onClose={() => context?.feedbackModalVisual.Toggle()}>
        <div style={{ textAlign: 'center' }}>
            <h5><b>回复处理情况</b></h5>
            {context?.watch(hadFeedbackKey) === hadFeedbackKeyYes && <label style={{ color: 'red' }}>已反馈至外单位</label>}
        </div>
        <Form layout='horizontal'>
            <Form.Item label='公文标题'>
                <Input value={context?.watch('title')} readOnly></Input>
            </Form.Item>

            <Form.Item label='处理结果' required>
                <Controller
                    control={control}
                    name='makeCLQKMode'
                    render={({ field }) => <Radio.Group {...field}>
                        <Space direction='vertical'>
                            <div>
                                <Radio value={MakeCLQKMode.Completed}>已办结</Radio>
                            </div>

                            <div>
                                <Radio value={MakeCLQKMode.NoDeal}>不办理</Radio>
                            </div>

                            <div>
                                <Radio value={MakeCLQKMode.ToRead}>转阅件</Radio>
                            </div>
                        </Space>
                    </Radio.Group>}
                />


                {watch('makeCLQKMode') !== MakeCLQKMode.Completed && <Controller
                    control={control}
                    name='reason'
                    rules={{ required: true }}
                    render={({ field }) =>
                        <Input {...field} placeholder=''></Input>}></Controller>}
            </Form.Item>

            <Form.Item label='联系人' required>
                <Controller
                    control={control}
                    rules={{ required: true }}
                    name='userDisplayName'
                    render={({ field }) =>
                        <Input {...field} placeholder=''></Input>}></Controller>
            </Form.Item>

            <Form.Item label='联系电话' required>
                <Controller
                    control={control}
                    name='phoneNumber'
                    rules={{ required: true }}
                    render={({ field }) =>
                        <Input {...field} placeholder=''></Input>}></Controller>
            </Form.Item>


            <Form.Item label='备注说明'>
                <Controller
                    control={control}
                    name='remark'
                    render={({ field }) =>
                        <Input {...field}></Input>}></Controller>
            </Form.Item>

            <Form.Item>
                <Space>
                    {context?.watch(hadFeedbackKey) === hadFeedbackKeyYes
                        ? <label></label> : <Button onClick={submit} htmlType='submit' type='primary'>回复处理情况</Button>}

                    <Button onClick={context?.feedbackModalVisual.Toggle}>返回</Button>
                </Space>
            </Form.Item>
        </Form>
    </MyDialog>
}