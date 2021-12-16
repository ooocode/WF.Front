
import { Breadcrumb, Button, Form, Input, notification, Space, Spin, Table } from 'antd'
import Search from 'antd/lib/input/Search'
import { ColumnsType } from 'antd/lib/table'
import produce from 'immer'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useAsync } from 'react-use'
import MainLayout from '../../components/MainLayout'
import MainLayout1 from '../../components/MainLayout'
import MyDialog from '../../components/MyDialog'
import { dataStorageClient, keyValueStorageClient, usersClient, useUser } from '../../hooks/useApi'
import { IuseToggleResult, useToggle } from '../../hooks/useToggle'


interface IItem {
    id: string
    name: string
    classType: string
    originCount: number
    currentCount: number
    money: number //价值
    userDisplayName: string
    department: string
    ISBN: string
}

const key = 'BookManagement'

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


export default () => {
    const dlg = useToggle()
    const { control, handleSubmit, setValue } = useForm<IItem>()
    const reloadData = useToggle()
    const statDlgVisual = useToggle()
    const [items, setItems] = useState<IItem[]>([])
    const [name, setName] = useState('')
    const [userDisplayName, setUserDisplayName] = useState('')
    const [department, setDepartment] = useState('')

    const { userName } = useUser()
    const state = useAsync(async () => {
        if (userName) {
            const user = await usersClient.getUserByUserName(userName)
            if (user !== null) {
                setValue('userDisplayName', user.name ?? '')
                setValue('department', user.mainDepatment ?? '')
            }
            setValue('originCount', 1)

            var ls = await keyValueStorageClient.get(key)
            let temp = (ls.value ?? []) as IItem[]
            if (name.trim().length > 0) {
                temp = temp.filter(e => e.name.indexOf(name) !== -1)
            }

            if (userDisplayName.trim().length > 0) {
                temp = temp.filter(e => e.userDisplayName.indexOf(userDisplayName) !== -1)
            }

            if (department.trim().length > 0) {
                temp = temp.filter(e => e.department.indexOf(department) !== -1)
            }

            setItems(temp)
        }
    }, [reloadData.value, name, userDisplayName, department.split, userName])

    const submit = handleSubmit(async (data) => {
        const newState = produce(items, next => {
            data.currentCount = data.originCount
            data.id = guid()
            next.push(data)
        })

        await keyValueStorageClient.set(key, newState)
        reloadData.Toggle()
    })


    const deleteItem = async (item: IItem) => {
        const newState = produce(items, next => {
            var index = next.findIndex(e => e.id == item.id)
            if (index !== -1) {
                next.splice(index, 1)
                notification.success({ message: '删除成功' })
            }
        })

        await keyValueStorageClient.set(key, newState)
        reloadData.Toggle()
    }

    const descItem = async (item: IItem) => {
        const newState = produce(items, next => {
            var index = next.findIndex(e => e.id == item.id)
            if (index !== -1) {
                if (next[index].currentCount > 0) {
                    next[index].currentCount--
                    notification.success({ message: '领用成功' })
                } else {
                    notification.error({ message: "暂无库存" })
                }
            }
        })

        await keyValueStorageClient.set(key, newState)
        reloadData.Toggle()
    }

    const addItem = async (item: IItem) => {
        const newState = produce(items, next => {
            var filter = next.filter(e => e.id == item.id)
            if (filter.length > 0) {
                if (filter[0].currentCount < filter[0].originCount) {
                    filter[0].currentCount++
                    notification.success({ message: '归还成功' })
                } else {
                    notification.warning({ message: '无需归还' })
                }
            }
        })

        await keyValueStorageClient.set(key, newState)
        reloadData.Toggle()
    }


    const columns: ColumnsType<IItem> = [
        {
            title: "书名",
            render: (item: IItem) => item.name,
            width: 90
        },
        {
            title: "ISBN",
            render: (item: IItem) => item.ISBN,
            width: 90
        },
        {
            title: "分类",
            render: (item: IItem) => item.classType,
            width: 80
        },
        {
            title: "所有者",
            render: (item: IItem) => item.userDisplayName,
            width: 80
        },
        {
            title: "部门",
            render: (item: IItem) => item.department,
            width: 80
        },
        {
            title: "当前库存",
            render: (item: IItem) => item.currentCount,
            width: 80
        },
        {
            title: "初始库存",
            render: (item: IItem) => item.originCount,
            width: 80
        },
        {
            title: "价值(元)",
            render: (item: IItem) => item.money,
            width: 80
        },
        {
            title: "操作",
            render: (item: IItem) => <Space>
                <Button onClick={() => descItem(item)}>借书</Button>
                <Button onClick={() => addItem(item)}>还书</Button>
                <Button onClick={() => deleteItem(item)} danger>销毁</Button>
            </Space>,
            width: 80
        }
    ];

    return <MainLayout>
        <Breadcrumb>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>图书管理</Breadcrumb.Item>
        </Breadcrumb>
        <hr />
        <Space>
            <Button onClick={dlg.Toggle}>图书登记入库</Button>
            <Button onClick={statDlgVisual.Toggle}>统计分析</Button>
        </Space>

        <hr />
        <Form layout='inline'>
            <Form.Item label="书名">
                <Search onSearch={e => setName(e)} enterButton placeholder="" allowClear></Search>
            </Form.Item>

            <Form.Item label="姓名">
                <Search onSearch={e => setUserDisplayName(e)} enterButton placeholder="" allowClear></Search>
            </Form.Item>

            <Form.Item label="部门">
                <Search onSearch={e => setDepartment(e)} enterButton placeholder="" allowClear></Search>
            </Form.Item>
        </Form>

        <Table
            columns={columns}
            rowKey={(record: IItem) => record.id ?? ""}
            dataSource={items}
            loading={state.loading}
        />

        <MyDialog open={dlg.value} title="图书登记入库" onClose={dlg.Toggle}>
            <Form>
                <Form.Item label="书名" required>
                    <Controller control={control} name='name'
                        rules={{ required: true }}
                        render={({ field }) => <Input {...field}></Input>} />
                </Form.Item>

                <Form.Item label="ISBN" required>
                    <Controller control={control} name='ISBN'
                        rules={{ required: true }}
                        render={({ field }) => <Input {...field}></Input>} />
                </Form.Item>

                <Form.Item label="分类">
                    <Controller control={control} name='classType'
                        rules={{ required: true }}
                        render={({ field }) => <Input {...field}></Input>} />
                </Form.Item>

                <Form.Item label="数量(本)">
                    <Controller control={control} name='originCount'
                        rules={{ required: true }}
                        render={({ field }) => <Input {...field} type='number'></Input>} />
                </Form.Item>

                <Form.Item label="操作人">
                    <Controller control={control} name='userDisplayName'
                        rules={{ required: true }}
                        render={({ field }) => <Input {...field}></Input>} />
                </Form.Item>

                <Form.Item label="部门">
                    <Controller control={control} name='department'
                        rules={{ required: true }}
                        render={({ field }) => <Input {...field}></Input>} />
                </Form.Item>

                <Form.Item label="价值(元)">
                    <Controller control={control} name='money'
                        rules={{ required: true }}
                        render={({ field }) => <Input {...field} type='number'></Input>} />
                </Form.Item>
            </Form>

            <div style={{ textAlign: 'right' }}>
                <Button onClick={submit}>提交</Button>
            </div>
        </MyDialog>

        <StatDiglog visual={statDlgVisual}></StatDiglog>
    </MainLayout>
}


const StatDiglog = ({ visual }: { visual: IuseToggleResult }) => {
    const [totalMoney, setTotalMoney] = useState<number>(0)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [totalCurrent, setTotalCurrent] = useState<number>(0)

    const state = useAsync(async () => {
        var ls = await keyValueStorageClient.get(key)
        let temp = (ls.value ?? []) as IItem[]

        let tempTotalMoney = 0
        let tempTotalCount = 0;
        let tempTotalCurrent = 0;

        temp.forEach(e => {
            tempTotalMoney = tempTotalMoney + Number(e.money)
            tempTotalCount = tempTotalCount + Number(e.originCount)
            tempTotalCurrent = tempTotalCurrent + Number(e.currentCount)
        })

        setTotalMoney(tempTotalMoney)
        setTotalCount(tempTotalCount)
        setTotalCurrent(tempTotalCurrent)
    }, [visual.value])
    return <>
        <MyDialog title="图书统计分析" open={visual.value} onClose={visual.Toggle}>
            {state.loading ? <Spin /> : <Form>
                <Form.Item label="总库存">
                    <Input value={totalCount} readOnly />
                </Form.Item>
                <Form.Item label="当前库存">
                    <Input value={totalCurrent} readOnly />
                </Form.Item>
                <Form.Item label="总价值（元）">
                    <Input value={totalMoney} readOnly />
                </Form.Item>
            </Form>}
        </MyDialog>
    </>
}