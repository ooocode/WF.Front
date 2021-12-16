import { Drawer, Input, Space, TablePaginationConfig, Tag } from 'antd'
import Search from 'antd/lib/input/Search'
import { Button } from 'antd'
import Table, { ColumnsType } from 'antd/lib/table'
import { navigate, Link } from 'gatsby'
import produce from 'immer'
import React, { useContext, useEffect, useState } from 'react'
import { UserDto, UsersClient } from '../../WorkFlowApi'
import { axiosClient, fetchClient, usersClient } from '../../hooks/useApi'
import { useQueryStringParser } from '../../hooks/useQueryStringParser'
import { useStateEx, useToggle } from '../../hooks/useToggle'
import { messageBox } from '../../messageBox'
import { SelectActivityContext } from '../../pages/AdminPages/ActivityUsersConfig'
import { IAssigneeUser } from '../../WorkFlowApi'
import { workFlowBaseUrl } from '../../Commmon/consts'

export function UsersSearch() {
    const context = useContext(SelectActivityContext)

    const users = useStateEx<UserDto[]>([])
    const pending = useStateEx<boolean>(true)

    const pageIndex = useStateEx(1)
    const pageSize = useStateEx(10)
    const total = useStateEx(0)

    const reloadUsersState = useToggle()
    const queryUserName = useStateEx('')
    const queryName = useStateEx('')

    useEffect(() => {
        let usersClient = new UsersClient(workFlowBaseUrl, { fetch: fetchClient })
        pending.setValue(true)
        let skip = (pageIndex.value - 1) * pageSize.value
        //查询用户
        usersClient.getUsers(skip, pageSize.value, queryUserName.value, queryName.value, false, true).then(res => {
            users.setValue(res.rows ?? [])
            total.setValue(res.total ?? 0)
        }).catch(err => messageBox(err))
            .finally(() => pending.setValue(false))
    }, [pageIndex.value, pageSize.value, reloadUsersState.value, queryUserName.value, queryName.value])

    const onChangePage = (page: TablePaginationConfig) => {
        pageIndex.setValue(page.current ?? 1)
        pageSize.setValue(page.pageSize ?? 10)
    }


    const columns: ColumnsType<UserDto> = [{
        render: (e: UserDto) => e.user?.userName,
        title: '账号'
    }, {
        title: '姓名',
        render: (e: UserDto) => e.user?.name
    }, {
        title: '部门',
        render: (e: UserDto) => e.departments?.map(ee => ee.name)
    }]

    const onSelectedChange = (keys: React.Key[], rows: UserDto[]) => {
        if (rows.length > 0) {
            let newState = produce(context?.selectedUsers.value, next => {
                rows.forEach(element => {
                    if (next?.findIndex(e => e.userName === element.user?.userName) === -1) {
                        next?.push({ userName: element.user?.userName, name: element.user?.name })
                    }
                });
            })

            context?.selectedUsers.setValue(newState ?? [])
        }
    }

    const deleteItem = (item: IAssigneeUser) => {
        let newState = produce(context?.selectedUsers.value, next => {
            var index = next?.findIndex(e => e.userName === item.userName) ?? -1
            if (index > -1) {
                next?.splice(index, 1)
            }
        })

        context?.selectedUsers.setValue(newState ?? [])
    }

    return <div>
        <div>
            {context?.selectedUsers.value.map(e => {
                return <Tag key={e.userName} closable onClose={() => deleteItem(e)}>{e.userName},{e.name}</Tag>
            })}

            <Button onClick={e => context?.openUserSearchDlg.Toggle()}>添加用户</Button>
            {(context?.selectedUsers.value.length ?? 0) > 0 ? <Button onClick={e => context?.selectedUsers.setValue([])} danger>全部清空</Button> : <></>}
        </div>
        <Drawer
            title="添加用户"
            placement="right"
            width={600}
            onClose={() => context?.openUserSearchDlg.Toggle()}
            visible={context?.openUserSearchDlg.value}
        >
            <Space>
                <label>用户名</label>
                <Input onChange={e => queryUserName.setValue(e.target.value)} allowClear />

                <label>姓名</label>
                <Input onChange={e => queryName.setValue(e.target.value)} allowClear />
            </Space>


            <Table
                columns={columns}
                rowKey={(record: UserDto) => record.user?.id ?? ""}
                dataSource={users.value}
                pagination={{ total: total.value, current: pageIndex.value, pageSize: pageSize.value, showQuickJumper: true }}
                loading={pending.value}
                onChange={onChangePage}
                rowSelection={{ onChange: onSelectedChange }}
                size='small'
            />
        </Drawer>
    </div >
}