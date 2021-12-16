import { Button, Drawer, Input, Space, Table, Tag } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { produce } from 'immer'
import React, { useContext, useEffect, useState } from 'react'
import { departmentsClient } from '../../hooks/useApi'
import { messageBox } from '../../messageBox'
import { SelectActivityContext } from '../../pages/AdminPages/ActivityUsersConfig'
import { DepartmentTreeNode, IDepartmentTreeNode } from '../../WorkFlowApi'

export function DepartmentSearch() {
    const context = useContext(SelectActivityContext)
    const [departments, setDepartments] = useState<IDepartmentTreeNode[]>([])

    useEffect(() => {
        departmentsClient.getDepartmentArray(undefined).then(res => {
            setDepartments(res)
        }).catch(err => messageBox(err))
    }, [])

    const onSelectedChange = (keys: React.Key[], rows: IDepartmentTreeNode[]) => {
        if (rows.length > 0) {
            context?.updateSelectedDepartments(next => {
                rows.forEach(element => {
                    if (next?.findIndex(e => e.key === element.key) === -1) {
                        next?.push(element)
                    }
                });
            })
        }
    }

    const deleteSelectDepartment = (item: IDepartmentTreeNode) => {
        context?.updateSelectedDepartments(next => {
            const index = next.findIndex(e => e.key === item.key)
            if (index !== -1) {
                next.splice(index, 1)
            }
        })
    }

    const columns: ColumnsType<IDepartmentTreeNode> = [{
        render: (e: IDepartmentTreeNode) => e.title,
        title: '部门名称'
    }]

    return <div>
        <div>
            {context?.selectedDepartments.map(e => {
                return <Tag key={e.key} closable onClose={() => deleteSelectDepartment(e)}>{e.title}</Tag>
            })}

            <Button onClick={e => context?.openDepartmentSearchDlg.Toggle()}>添加部门</Button>
            {(context?.selectedDepartments.length ?? 0) > 0 ? <Button onClick={e => context?.updateSelectedDepartments([])} danger>全部清空</Button> : <></>}
        </div>

        <Drawer
            title="添加部门"
            placement="right"
            width={600}
            onClose={() => context?.openDepartmentSearchDlg.Toggle()}
            visible={context?.openDepartmentSearchDlg.value}
        >
            <Space>
                <label>部门名称</label>
                <Input allowClear />
            </Space>


            <Table
                columns={columns}
                rowKey={(record: IDepartmentTreeNode) => record.key}
                dataSource={departments}
                //pagination={{ total: total.value, current: pageIndex.value, pageSize: pageSize.value, showQuickJumper: true }}
                //loading={pending.value}
                //onChange={onChangePage}
                rowSelection={{ onChange: onSelectedChange }}
                size='small'
            />
        </Drawer>
    </div>
}