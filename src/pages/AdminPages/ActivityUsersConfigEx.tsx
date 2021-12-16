import React, { createContext, useEffect, useState } from 'react';
import { AssigneeUser, IAssigneeUser, IDepartmentTreeNode, ProcessDefConfig, ProcessDefConfigItem, ProcessDefConfigUserTaskItem, QueryMode, UpdateUserTaskViewModel, UserTaskItem, UserTaskItemType } from '../../WorkFlowApi';
import { processDefsClient, processDefsExClient } from '../../hooks/useApi';
import { messageBox } from '../../messageBox';
import { Button, Checkbox, Col, Form, Row, Space, Tag, Tree } from 'antd';
import { Radio } from 'antd';
import { IUseStateExResult, IuseToggleResult, useStateEx, useToggle } from '../../hooks/useToggle';
import { UsersSearch } from '../../components/ActivityConfigComponents/UsersSearch';
import { DepartmentSearch } from '../../components/ActivityConfigComponents/DepartmentSearch';
import { Key } from 'antd/lib/table/interface';
import produce from 'immer';
import { FormFieldsConfig } from '../../components/ActivityConfigComponents/FormFieldsConfig';
import MainLayout from '../../components/MainLayout';
import { Updater, useImmer } from 'use-immer';

export interface ISelectActivity {
    selectActivity?: IUseStateExResult<UserTaskItem | undefined>
    openUserSearchDlg: IuseToggleResult
    openDepartmentSearchDlg: IuseToggleResult

    selectedUsers: IUseStateExResult<IAssigneeUser[]>
    selectedDepartments: IDepartmentTreeNode[]
    // updateSelectedDepartments: Updater<IDepartmentTreeNode[]>
}

export const SelectActivityContext = createContext<ISelectActivity | undefined>(undefined)

const ProDefList = () => {
    const [data, setData] = useState<UserTaskItem[]>([])
    const selectActivity = useStateEx<UserTaskItem | undefined>(undefined)
    const openUserSearchDlg = useToggle()
    const openDepartmentSearchDlg = useToggle()
    const selectedUsers = useStateEx<IAssigneeUser[]>([])
    const reloadDataToggle = useToggle()


    const [selectedDepartments, updateSelectedDepartments] = useState<IDepartmentTreeNode[]>([])


    const [processDefs, updateProcessDefs] = useState<ProcessDefConfigItem[]>([])
    const [selectedProcessDefIndex, updateSelectedProcessDefIndex] = useImmer<number | undefined>(undefined)
    const [selectedActivityIndex, updateSelectedActivityIndex] = useImmer<number | undefined>(undefined)

    useEffect(() => {
        processDefsExClient.getProcessDefConfig().then(res => {
            updateProcessDefs(res.processDefConfigItems ?? [])
        }).catch(err => messageBox(err))
    }, [reloadDataToggle.value])

    const getField = (key: keyof ProcessDefConfigUserTaskItem) => {
        if (selectedProcessDefIndex && selectedActivityIndex) {
            return processDefs[selectedProcessDefIndex].processDefConfigUserTaskItems![selectedActivityIndex]
        }
    }


    const updateQueryMode = (model: QueryMode) => {
        if (selectedProcessDefIndex && selectedActivityIndex) {
            const newState = produce(processDefs, next => {
                next[selectedProcessDefIndex].processDefConfigUserTaskItems![selectedActivityIndex].queryMode = model
            })

            updateProcessDefs(newState)
        }
    }


    const saveClicked = () => {
        if (selectActivity.value) {
            let vm = new UpdateUserTaskViewModel()
            //vm.queryMode = selectStyle

            if (selectActivity.value.parent) {
                // //是用户任务
                vm.processDefKey = selectActivity.value.parent.key
                vm.processDefName = selectActivity.value.parent.title
                vm.activityId = selectActivity.value.key
                vm.activityName = selectActivity.value.title
            } else {
                //处理定义
                vm.processDefKey = selectActivity.value.key
                vm.processDefName = selectActivity.value.title
            }

            vm.assigneeUsers = selectedUsers.value.map(e => { return AssigneeUser.fromJS(e) })


            processDefsClient.updateUserTask(vm).then(res => {
                reloadDataToggle.Toggle()
                messageBox('保存成功')
            }).catch(err => messageBox(err))
        }
    }


    return <MainLayout>
        <Row>
            <Col span={6}>
                {processDefs.map(e => {
                    return <div key={e.processDefKey}>
                        <h5>{e.processDefName}</h5>
                        {e.processDefConfigUserTaskItems?.map((task,index) => {
                            return <Tag key={task.activityId}
                                onClick={() => { }}>
                                {task.activityName}
                            </Tag>
                        })}
                    </div>
                })}
            </Col>

            {selectedProcessDefIndex ? <Col span={18}>
                <div>
                    <label htmlFor=""></label>

                    <Form>
                        <Form.Item label="可编辑表单">
                            <Checkbox checked={false}
                                onChange={e => { }}>可编辑表单</Checkbox>
                        </Form.Item>

                        <Form.Item label="可上传附件">
                            <Checkbox checked={false}
                                onChange={e => { }}>可上传附件</Checkbox>
                        </Form.Item>

                        <Form.Item label="用户选择方式">
                            <Radio.Group value={QueryMode._0} onChange={e => { updateQueryMode(e.target.value as QueryMode) }}>
                                <Space direction='vertical'>
                                    <Radio value={QueryMode._0}>不指定</Radio>
                                    <Radio value={QueryMode._1}>流程创建人</Radio>
                                    <Radio value={QueryMode._2}>我的部门领导（包含虚拟部门）</Radio>
                                    <Radio value={QueryMode._3}>我的部门领导（不包含虚拟部门）</Radio>
                                    <Radio value={QueryMode._4}>我的部门成员（包含虚拟部门且包含领导）</Radio>
                                    <Radio value={QueryMode._5}>我的部门成员（包含虚拟部门且不包含领导）</Radio>
                                    <Radio value={QueryMode._6}>我的部门成员（不包含虚拟部门且包含领导）</Radio>
                                    <Radio value={QueryMode._7}>我的部门成员（不包含虚拟部门且不包含领导）</Radio>
                                    <Radio value={QueryMode._8}>所有部门领导（包含虚拟部门）</Radio>
                                    <Radio value={QueryMode._9}>所有部门领导（不包含虚拟部门）</Radio>
                                    <Radio value={QueryMode._10}>拟稿人的领导（包含虚拟部门）</Radio>
                                    <Radio value={QueryMode._11}>拟稿人的领导（不包含虚拟部门）</Radio>
                                </Space>
                            </Radio.Group>
                        </Form.Item>

                        <SelectActivityContext.Provider
                            value={{
                                selectActivity: selectActivity,
                                openUserSearchDlg: openUserSearchDlg,
                                openDepartmentSearchDlg: openDepartmentSearchDlg,
                                selectedUsers: selectedUsers,
                                selectedDepartments: selectedDepartments,
                                //updateSelectedDepartments: updateSelectedDepartments
                            }}>
                            <Form.Item label="额外用户">
                                <UsersSearch></UsersSearch>
                            </Form.Item>

                            <Form.Item label="额外部门">
                                {/* <DepartmentSearch></DepartmentSearch> */}
                            </Form.Item>

                            <Form.Item label="操作">
                                <Button onClick={saveClicked}>保存</Button>
                            </Form.Item>
                        </SelectActivityContext.Provider>
                    </Form>
                </div>
            </Col> : <></>}
        </Row>
    </MainLayout>
}



const ActivityUsersConfig = () => {
    return <div>
        <ProDefList />
    </div>
}

export default ActivityUsersConfig