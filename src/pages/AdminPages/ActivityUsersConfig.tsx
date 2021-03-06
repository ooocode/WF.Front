import React, { createContext, useEffect, useState } from 'react';
import { AssigneeUser, IAssigneeUser, IDepartmentTreeNode, QueryMode, UpdateUserTaskViewModel, UserTaskItem, UserTaskItemType } from '../../WorkFlowApi';
import { processDefsClient } from '../../hooks/useApi';
import { messageBox } from '../../messageBox';
import { Button, Checkbox, Col, Form, Row, Space, Tree } from 'antd';
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
    updateSelectedDepartments: Updater<IDepartmentTreeNode[]>
}

export const SelectActivityContext = createContext<ISelectActivity | undefined>(undefined)

const ProDefList = () => {
    const [data, setData] = useState<UserTaskItem[]>([])
    const selectActivity = useStateEx<UserTaskItem | undefined>(undefined)
    const openUserSearchDlg = useToggle()
    const openDepartmentSearchDlg = useToggle()
    const selectedUsers = useStateEx<IAssigneeUser[]>([])
    const reloadDataToggle = useToggle()
    const [selectStyle, setSelectStyle] = useState<QueryMode>(QueryMode._0)
    const canEditForm = useStateEx<boolean>(false)
    const canUploadOrUpdateFiles = useStateEx<boolean>(false)
    const checkItems = useStateEx<Key[]>([])

    const [selectedDepartments, updateSelectedDepartments] = useImmer<IDepartmentTreeNode[]>([])

    useEffect(() => {
        processDefsClient.getUserTasks().then(res => {
            setData(res)
        }).catch(err => messageBox(err))
    }, [reloadDataToggle.value])


    const onSelect = (selectedKeys: React.Key[]) => {
        if (selectedKeys?.length > 0) {
            var key = selectedKeys[0].toString()
            let queue: UserTaskItem[] = []
            data?.forEach(element => {
                queue.push(element)
            });

            while (queue.length > 0) {
                let top = queue.pop()
                if (top?.key === key) {
                    setSelectStyle(top.queryMode ?? QueryMode._0)
                    selectedUsers.setValue(top.assigneeUsers ?? [])
                    selectActivity.setValue(top)
                    canEditForm.setValue(top.canEditForm ?? false)
                    canUploadOrUpdateFiles.setValue(top.canUploadOrUpdateFiles ?? false)
                    return
                }

                top?.children?.forEach(element => {
                    queue.push(element)
                });
            }
        }


        selectedUsers.setValue([])
        setSelectStyle(QueryMode._0)
        selectActivity.setValue(undefined)
        canEditForm.setValue(false)
        canUploadOrUpdateFiles.setValue(false)
    }

    const saveClicked = () => {
        if (selectActivity.value) {
            let vm = new UpdateUserTaskViewModel()
            vm.queryMode = selectStyle

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
        
            vm.canEditForm = canEditForm.value
            vm.canUploadOrUpdateFiles = canUploadOrUpdateFiles.value

            processDefsClient.updateUserTask(vm).then(res => {
                reloadDataToggle.Toggle()
                messageBox('????????????')
            }).catch(err => messageBox(err))
        }
    }

    const onTreeChecked = (ks: {
        checked: Key[];
        halfChecked: Key[];
    } | Key[]) => {
        let k = ks as Key[]
        checkItems.setValue(k)
    }

    return <MainLayout>
        <Row>
            <Col span={6}>
                <Tree
                    //checkable
                    treeData={data}
                    onSelect={onSelect}
                    onCheck={(checked) => onTreeChecked(checked)} />
            </Col>

            {selectActivity.value ? <Col span={18}>
                <div>
                    <label htmlFor="">{selectActivity.value?.title}-{selectActivity.value.key}</label>
                    <FormFieldsConfig></FormFieldsConfig>
                    <Form>
                        <Form.Item label="???????????????">
                            <Checkbox checked={canEditForm.value}
                                onChange={e => canEditForm.setValue(e.target.checked)}>???????????????</Checkbox>
                        </Form.Item>

                        <Form.Item label="????????????????????????">
                            <Checkbox checked={canUploadOrUpdateFiles.value}
                                onChange={e => canUploadOrUpdateFiles.setValue(e.target.checked)}>????????????????????????</Checkbox>
                        </Form.Item>

                        <Form.Item label="??????????????????">
                            <Radio.Group value={selectStyle} onChange={e => setSelectStyle(e.target.value)}>
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
                                updateSelectedDepartments: updateSelectedDepartments
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