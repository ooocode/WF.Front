import React, { useContext, useEffect, useRef } from "react";
import { useState } from "react";
import { messagesClient, processInstancesClient, tasksClient, userTasksClient, useUser } from "../hooks/useApi";
import { FormContext } from "../hooks/useTask";
import { IuseToggleResult, useStateEx, useToggle } from "../hooks/useToggle";
import { messageBox, notificationError } from "../messageBox";
import { ErrorModel, ITakebackItem, RuntimeUserTaskTask, SendShortMessageViewModel, TakebackActivityViewModel, TakebackItem } from "../WorkFlowApi";
import { CheckboxGroup } from "./CheckboxGroup";
import MyDialog from "./MyDialog";
import { Alert, Button, Checkbox, Divider, Form, Input, notification, Space, Tooltip } from 'antd';
import { useAsync } from "react-use";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useFormQueryString } from "../hooks/useFormQueryString";
const { TextArea } = Input;

interface IUrgeProps {
    visual: IuseToggleResult,
    businessKey: string
}

export const TakebackDlg = (props: IUrgeProps) => {
    const context = useContext(FormContext)
    const checkerTasks = useRef<RuntimeUserTaskTask[]>([])
    const reload = useToggle()
    const { taskId } = useFormQueryString()

    const { userName } = useUser()

    const runtimeTasks = useAsync(async () => {
        if (props.businessKey.length > 0 && props.visual.value === true) {
            if (userName) {
                let res = await userTasksClient.getRuntimeUserTaskByBusinessKey(props.businessKey)
                if (res.value) {
                    res.value = res.value.filter(e => e.userName !== userName)
                    return res
                }
            }
        }
    }, [props.businessKey, props.visual.value, reload.value, userName])



    const onchecked = (task: RuntimeUserTaskTask, checked: boolean) => {
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


    const sendMessage = async () => {
        if (taskId !== null) {
            if (checkerTasks.current.length === 0) {
                notification.error({
                    message: '???????????????????????????'
                })

                return
            }

            try {
                let vm = new TakebackActivityViewModel()
                const items: ITakebackItem[] = checkerTasks.current.map(e => {
                    return {
                        userDisplayName: e.userDisplayName,
                        activityInstanceId: e.activityInstanceId
                    }
                })
                vm.takebackItems = items.map(e => TakebackItem.fromJS(e))

                await userTasksClient.takebackActivity(taskId, vm)
                notification.success({ message: '????????????????????????????????????????????????' })
            } catch (error) {
                notificationError('????????????????????????', error)
            }
            checkerTasks.current = []
            reload.Toggle()
        }
    }

    return <MyDialog open={props.visual.value} onClose={props.visual.Toggle} title={`??????????????????${context?.task.value?.activityName}`}>
        <Form layout="vertical">
            <Form.Item label={<span style={{ color: 'red' }}>??????????????????????????????</span>}>
                {runtimeTasks.value?.value?.filter(e => (e.assigneeDatetime?.length ?? 0) === 0).map(e => {
                    return <Checkbox key={e.taskId} onChange={ee => onchecked(e, ee.target.checked)}>{e.userDisplayName}({e.activityName})</Checkbox>
                })}
            </Form.Item>
            <hr />

            {(userName === 'wuxj' || userName === 'liuhuan') ? <Form.Item label="?????????????????????????????????">
                {runtimeTasks.value?.value?.filter(e => (e.assigneeDatetime?.length ?? 0) > 0).map(e => {
                    return <Checkbox key={e.taskId} onChange={ee => onchecked(e, ee.target.checked)}>{e.userDisplayName}({e.activityName})</Checkbox>
                })}
            </Form.Item> : <Tooltip title="???????????????????????????????????????????????????????????????????????????????????????"> <Form.Item label={<>??????????????????????????????</>}>
                {runtimeTasks.value?.value?.filter(e => (e.assigneeDatetime?.length ?? 0) > 0).map(e => {
                    return <Checkbox key={e.taskId} disabled>{e.userDisplayName}({e.activityName})</Checkbox>
                })}
                <br />
            </Form.Item></Tooltip>
            }

            <hr />
            <Form.Item label="">
                <Space>
                    <Button onClick={sendMessage} type='primary'>????????????</Button>
                    <Button onClick={props.visual.Toggle}>??????</Button>
                </Space>
            </Form.Item>
        </Form>
    </MyDialog>
}