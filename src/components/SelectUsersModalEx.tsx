import React, { createRef, useEffect, useState } from "react"
import { useContext } from "react";
import MyDialog from "./MyDialog";
import { Col, Drawer, Form, Modal, Radio, Row, Space, Spin, Tree } from "antd";
import { FormContext } from "../hooks/useTask";
import { IDisposeItem } from "../WorkFlowApi";
import Checkbox from "antd/lib/checkbox/Checkbox";
import { workFlowBaseUrl } from "../Commmon/consts";
import { useFormQueryString } from "../hooks/useFormQueryString";
import { useAsync, useEvent } from "react-use";
import { tasksClient, userTasksClient } from "../hooks/useApi";
import { Helmet } from "react-helmet";
import { withPrefix } from "gatsby";

interface IUser {
    key: string
    title: string
}

export function SelectUsersModalEx() {
    const formContext = useContext(FormContext)
    const { mode, taskId } = useFormQueryString()

    const disposes = useAsync(async () => {
        if (taskId) {
            const res = await tasksClient.getDisposesMobile(taskId)
            console.log(res)
            return res
        }
    }, [taskId])


    const [users, setUsers] = useState<IUser[]>([])

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

    const [dispose, setDispose] = useState<string>()
    const onDisposeChange = async (dispose: string) => {
        if (taskId) {
            var item = disposes.value?.filter(e => e.seqFlowName === dispose)[0]
            setDispose(dispose)
            const users = await tasksClient.getUsersByDispose(taskId, item?.targetActivityId, dispose)
            setUsers(users.map(e => {
                return {
                    key: e.mainDepatment + '_' + e.userName,
                    title: e.name ?? ''
                }
            }))
            console.log(users)
        }
    }

    return <MyDialog
        open={formContext?.selectUsersModalVisual.value ?? false}
        onClose={() => formContext?.selectUsersModalVisual.Toggle()}
        title={`当前状态【${formContext?.task?.value?.activityName}】，选择下一步和用户`}
    >
        <div style={{ height: 500 }}>
            <Row>
                <Col span={8}>
                    <Radio.Group value={dispose} onChange={e => onDisposeChange(e.target.value)}>
                        <Space direction="vertical">
                            {disposes.value?.map(e => {
                                return <Radio value={e.seqFlowName} key={e.seqFlowName}>{e.seqFlowName}</Radio>
                            })}
                        </Space>
                    </Radio.Group>
                </Col>
                <Col span={16}>
                    {users.length > 0 && <TreeView users={users} />}

                </Col>
            </Row>
        </div>
        {/*  <Spin tip="处理中......" spinning={formContext?.processing}>
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
        </Spin> */}
    </MyDialog>
}


function TreeView({ users }: { users: IUser[] }) {
    const sRef = createRef<any>()
    useEffect(()=>{
        alert(1)
    },[users])
    return <div>
        <Helmet
            onChangeClientState={(newState, addedTags, removedTags) => {
                //console.log(newState, addedTags, removedTags)
                if (addedTags.scriptTags) {
                    var treeScript = addedTags.scriptTags[0]
                    treeScript.onload = () => {
                        //alert(111)
                        var el = (window as any).$(sRef.current)
                        var tree = el.treeMultiselect({
                            enableSelectAll: true,
                            //sortable: true,
                            //maxSelections: 1,
                            searchable: true,
                            selectAllText: '全选',
                            unselectAllText: '全不选',
                            //startCollapsed: startCollapsed,
                            //onChange: treeOnChange
                        });
                        tree[0].reload()
                        //tree.reload()
                    }
                }

            }}>
            <link href='http://172.26.130.105:81/tree.css' rel="stylesheet"></link>
            <script src={withPrefix('/jquery.min.js')}></script>
        </Helmet>

        <div style={{ height: 500 }}>
            <select id='qqq' ref={sRef} multiple={true} style={{ height: 500 }}>
                {users.map(e => {
                    return <option value={e.key} key={e.key}>{e.title}</option>
                })}
            </select>
        </div>
    </div>
}