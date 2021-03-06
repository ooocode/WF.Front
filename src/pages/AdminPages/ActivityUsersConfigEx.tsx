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
                // //???????????????
                vm.processDefKey = selectActivity.value.parent.key
                vm.processDefName = selectActivity.value.parent.title
                vm.activityId = selectActivity.value.key
                vm.activityName = selectActivity.value.title
            } else {
                //????????????
                vm.processDefKey = selectActivity.value.key
                vm.processDefName = selectActivity.value.title
            }

            vm.assigneeUsers = selectedUsers.value.map(e => { return AssigneeUser.fromJS(e) })


            processDefsClient.updateUserTask(vm).then(res => {
                reloadDataToggle.Toggle()
                messageBox('????????????')
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
                        <Form.Item label="???????????????">
                            <Checkbox checked={false}
                                onChange={e => { }}>???????????????</Checkbox>
                        </Form.Item>

                        <Form.Item label="???????????????">
                            <Checkbox checked={false}
                                onChange={e => { }}>???????????????</Checkbox>
                        </Form.Item>

                        <Form.Item label="??????????????????">
                            <Radio.Group value={QueryMode._0} onChange={e => { updateQueryMode(e.target.value as QueryMode) }}>
                                <Space direction='vertical'>
                                    <Radio value={QueryMode._0}>?????????</Radio>
                                    <Radio value={QueryMode._1}>???????????????</Radio>
                                    <Radio value={QueryMode._2}>??????????????????????????????????????????</Radio>
                                    <Radio value={QueryMode._3}>?????????????????????????????????????????????</Radio>
                                    <Radio value={QueryMode._4}>?????????????????????????????????????????????????????????</Radio>
                                    <Radio value={QueryMode._5}>????????????????????????????????????????????????????????????</Radio>
                                    <Radio value={QueryMode._6}>????????????????????????????????????????????????????????????</Radio>
                                    <Radio value={QueryMode._7}>???????????????????????????????????????????????????????????????</Radio>
                                    <Radio value={QueryMode._8}>??????????????????????????????????????????</Radio>
                                    <Radio value={QueryMode._9}>?????????????????????????????????????????????</Radio>
                                    <Radio value={QueryMode._10}>??????????????????????????????????????????</Radio>
                                    <Radio value={QueryMode._11}>?????????????????????????????????????????????</Radio>
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
                            <Form.Item label="????????????">
                                <UsersSearch></UsersSearch>
                            </Form.Item>

                            <Form.Item label="????????????">
                                {/* <DepartmentSearch></DepartmentSearch> */}
                            </Form.Item>

                            <Form.Item label="??????">
                                <Button onClick={saveClicked}>??????</Button>
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