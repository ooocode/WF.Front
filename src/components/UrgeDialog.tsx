import React, { useContext, useEffect, useRef } from "react";
import { useState } from "react";
import { messagesClient, processInstancesClient, useUser } from "../hooks/useApi";
import { FormContext } from "../hooks/useTask";
import { IuseToggleResult, useStateEx } from "../hooks/useToggle";
import { messageBox } from "../messageBox";
import { SendShortMessageViewModel, TodoTaskByBusinessKey } from "../WorkFlowApi";
import { CheckboxGroup } from "./CheckboxGroup";
import MyDialog from "./MyDialog";
import { Button, Checkbox, Divider, Form, Input, notification } from 'antd';
import { useAsync } from "react-use";
const { TextArea } = Input;

interface IUrgeProps {
    visual: IuseToggleResult,
    businessKey: string
}

export const UrgeDialog = (props: IUrgeProps) => {
    const context = useContext(FormContext)
    const checkerTasks = useRef<TodoTaskByBusinessKey[]>([])
    const [tasks, setTasks] = useState<TodoTaskByBusinessKey[]>([])
    const [message, setMessage] = useState('')

    useEffect(() => {
        checkerTasks.current = []
        if (props.businessKey.length > 0 && props.visual.value === true) {
            processInstancesClient.getTodoTasksByBusinessKey(props.businessKey).then(res => {
                setTasks(res.filter(e => e.userName))
            }).catch(err => messageBox(err))
        }
    }, [props.businessKey, props.visual.value])

    const { userDisplayName, phoneNumber } = useUser()

    useAsync(async () => {
        if (userDisplayName && phoneNumber) {
            if (context?.task?.value?.form?.title) {
                setMessage(`公文催办：${context.task.value?.form.title}。如已办理请忽略此信息。${userDisplayName} ${phoneNumber}。`)
            }
        }
    }, [context?.task?.value?.form?.title, userDisplayName, phoneNumber])


    const onchecked = (task: TodoTaskByBusinessKey, checked: boolean) => {
        if (checked) {
            checkerTasks.current.push(task)
        } else {

            let index = checkerTasks.current.findIndex(e => e.taskId === task.taskId)
            if (index !== -1) {
                checkerTasks.current.splice(index, 1)
            }
        }
        console.log(checkerTasks.current)
    }


    const sendMessage = () => {
        if (checkerTasks.current.length === 0) {
            notification.error({
                message: '请至少选择一个用户'
            })

            return
        }

        if (message.trim().length === 0) {
            notification.error({
                message: '请输入短信内容'
            })

            return
        }

        var phones = checkerTasks.current.map(e => e.phoneNumber ?? '')
        let model = new SendShortMessageViewModel()
        model.phoneNumbers = phones
        model.message = message.trim()
        messagesClient.sendShortMessage(model).then(res => {
            notification.success({ message: '发送催办短信成功，收件人：' + checkerTasks.current.map(e => e.name ?? '').join('、'), duration: null })
        }).catch(err => messageBox(err))
    }

    return <MyDialog open={props.visual.value} onClose={props.visual.Toggle} title="催办">
        <Form layout="vertical">
            <Form.Item label="未签收未办理的用户：">
                {tasks.filter(e => (e.assigneeDatetime?.length ?? 0) === 0).map(e => {
                    return <Checkbox key={e.taskId} onChange={ee => onchecked(e, ee.target.checked)}>{e.name},{e.phoneNumber}</Checkbox>
                })}
            </Form.Item>

            <Form.Item label="已签收但未办理的用户：">
                {tasks.filter(e => (e.assigneeDatetime?.length ?? 0) > 0).map(e => {
                    return <Checkbox key={e.taskId} onChange={ee => onchecked(e, ee.target.checked)}>{e.name}</Checkbox>
                })}
            </Form.Item>

            <Form.Item label="催办短信内容：">
                <TextArea rows={4} value={message} onChange={e => setMessage(e.target.value)} />
            </Form.Item>

            <Form.Item label="">
                <Button onClick={sendMessage}>发送短信</Button>
            </Form.Item>
        </Form>
    </MyDialog>
}