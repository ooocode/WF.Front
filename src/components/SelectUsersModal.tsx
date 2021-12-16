import React, { useEffect } from "react"
import { useContext } from "react";
import MyDialog from "./MyDialog";
import { Drawer, Form, Modal, Spin } from "antd";
import { FormContext } from "../hooks/useTask";
import { IDisposeItem } from "../WorkFlowApi";
import Checkbox from "antd/lib/checkbox/Checkbox";
import { workFlowBaseUrl } from "../Commmon/consts";
import { useFormQueryString } from "../hooks/useFormQueryString";
import { useEvent } from "react-use";


const SelectUsersModal = () => {
    const formContext = useContext(FormContext)
    const { mode } = useFormQueryString()

    const listener = async (e: MessageEvent<{ dispose: string, users: string, dispose1: string, user1: string, targetActivityIsMultiInstance: string }>) => {
        if (e.data.dispose) {
            console.log('data', e.data)

            let disposeItems: IDisposeItem[] = [];
            disposeItems.push({
                disposeVarName: 'dispose',
                disposeVarValue: e.data.dispose,
                assigneeVarName: "assignee",
                assigneeVarValue: e.data.users,
                targetActivityIsMultiInstance: e.data.targetActivityIsMultiInstance === "1" ? true : false,
                userListVarName: 'userList'
            })

            disposeItems.push({
                disposeVarName: 'dispose1',
                disposeVarValue: e.data.dispose1,
                assigneeVarName: "assignee1",
                assigneeVarValue: e.data.user1,
                targetActivityIsMultiInstance: true,
                userListVarName: 'userList1'
            })

            if (formContext) {
                formContext.CompleteTask(disposeItems)
            } else {
                console.log('formContext', formContext)
            }
            //formContext?.CompleteTask(disposeItems)
        }
    }

    useEvent('message', listener)

    return <MyDialog
        open={formContext?.selectUsersModalVisual.value ?? false}
        onClose={() => formContext?.selectUsersModalVisual.Toggle()}
        title={`当前状态【${formContext?.task?.value?.activityName}】，选择下一步和用户`}
    >
        <Spin tip="处理中......" spinning={formContext?.processing}>
            <Form>
                <Form.Item>
                    {formContext?.task?.value?.taskId ? <iframe style={{ width: "100%", minHeight: "500px", border: 0 }}
                        src={workFlowBaseUrl + "/FormPages/DisposeSelect?taskId=" + formContext?.task?.value?.taskId}></iframe> : <></>}
                </Form.Item>
                {mode === 'todo' && formContext?.task.value?.activityName === '发文人员往各地市县发与各单位送' && <Form.Item>
                    <Checkbox value={formContext.watch('是否同时发文转公文交换') === "是"}
                        onChange={e => formContext.setValue('是否同时发文转公文交换', e.target.checked ? '是' : '否')}>是否同时发文转公文交换</Checkbox>
                </Form.Item>}
            </Form>
        </Spin>
    </MyDialog>
}

export default SelectUsersModal