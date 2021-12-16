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
        
            vm.canEditForm = canEditForm.value
            vm.canUploadOrUpdateFiles = canUploadOrUpdateFiles.value

            processDefsClient.updateUserTask(vm).then(res => {
                reloadDataToggle.Toggle()
                messageBox('保存成功')
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
                        <Form.Item label="可编辑表单">
                            <Checkbox checked={canEditForm.value}
                                onChange={e => canEditForm.setValue(e.target.checked)}>可编辑表单</Checkbox>
                        </Form.Item>

                        <Form.Item label="可上传和修改附件">
                            <Checkbox checked={canUploadOrUpdateFiles.value}
                                onChange={e => canUploadOrUpdateFiles.setValue(e.target.checked)}>可上传和修改附件</Checkbox>
                        </Form.Item>

                        <Form.Item label="用户选择方式">
                            <Radio.Group value={selectStyle} onChange={e => setSelectStyle(e.target.value)}>
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
                                updateSelectedDepartments: updateSelectedDepartments
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