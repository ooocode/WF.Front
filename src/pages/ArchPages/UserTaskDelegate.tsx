import { Alert, Breadcrumb, Button, Checkbox, Form, Input, notification, Radio, Space } from 'antd'
import Table, { ColumnsType } from 'antd/lib/table'
import React, { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useAsync } from 'react-use'
import { workFlowBaseUrl } from '../../Commmon/consts'
import MainLayout from '../../components/MainLayout'
import MyDialog from '../../components/MyDialog'
import { departmentsClient, fetchClient, usersClient, useUser } from '../../hooks/useApi'
import { IuseToggleResult, useStateEx, useToggle } from '../../hooks/useToggle'
import { notificationError } from '../../messageBox'
import { CreateUserTaskDelegateViewModel, ErrorModel, ICreateUserTaskDelegateViewModel, UserTaskDelegatesClient, UserTaskDelegateViewModel } from '../../WorkFlowApi'
import { DatePicker } from 'antd';
import moment from 'moment';
import locale from 'antd/es/date-picker/locale/zh_CN';


const userTaskDelegatesClient = new UserTaskDelegatesClient(workFlowBaseUrl, { fetch: fetchClient })

export default () => {
    const reload = useToggle()
    const startDatetTimeMonent = useStateEx<moment.Moment | null>(null)
    const endDatetTimeMonent = useStateEx<moment.Moment | null>(null)

    const { userName } = useUser()

    const records = useAsync(async () => {
        if (userName) {
            const userQuery = await usersClient.getUserByUserName(userName)
            const res = await userTaskDelegatesClient.getUserTaskDelegates(userQuery.userName)
            const myDepartmentMembers = await departmentsClient.getDepartmentUsersByDepartmentName(userQuery?.mainDepatment)
            return { records: res, myDepartmentMembers: myDepartmentMembers }
        }
    }, [reload.value, userName])

    const deleteItem = (item: UserTaskDelegateViewModel) => {
        if (item.id) {
            userTaskDelegatesClient.delete(item.id).then(res => {
                notification.success({ message: '删除授权记录成功' })
                reload.Toggle()
            }).catch(err => notificationError('删除授权记录失败', err))
        }
    }

    const columns: ColumnsType<UserTaskDelegateViewModel> = [
        {
            title: "被授权人",
            render: (item: UserTaskDelegateViewModel) => item.toUserDisplayName,
            width: 90
        },
        {
            title: "开始时间",
            render: (item: UserTaskDelegateViewModel) => item.startDateTimeFormat,
            width: 80
        },
        {
            title: "结束时间",
            render: (item: UserTaskDelegateViewModel) => item.endDateTimeFormat,
            width: 80
        },
        {
            title: "操作",
            render: (item: UserTaskDelegateViewModel) => <Space>
                <Button danger size='small' onClick={() => deleteItem(item)}>删除</Button>
            </Space>,
            width: 80
        }
    ];

    const dlgVisual = useToggle()

    const { control, handleSubmit, register, setValue } = useForm<ICreateUserTaskDelegateViewModel>()

    const submit = handleSubmit(async data => {
        try {
            data.fromUserName = userName
            data.startDateTime = startDatetTimeMonent.value?.toDate()
            data.endDateTime = endDatetTimeMonent.value?.toDate()
            await userTaskDelegatesClient.createUserTaskDelegate(CreateUserTaskDelegateViewModel.fromJS(data))
            reload.Toggle()
            notification.success({ message: '创建成功' })
            dlgVisual.Toggle()
        } catch (error) {
            notificationError('创建授权发生错误', error)
        }
    })


    return <MainLayout>
        {/*   <Breadcrumb>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>公文授权</Breadcrumb.Item>
        </Breadcrumb> */}

        {records.error && <Alert
            message="Error"
            description={records.error.message}
            type="error"
            showIcon
        />}

        <Space>
            <div style={{ textAlign: 'right' }}>
                <Button onClick={dlgVisual.Toggle}>创建授权</Button>
            </div>
        </Space>

        <Table
            columns={columns}
            rowKey={(record) => record.id ?? ''}
            dataSource={records.value?.records.value}
            //pagination={{ total: archs.value?.total, pageSize: watch('pageSize') }}
            loading={records.loading}
        //onChange={handleTableChange}
        />

        <MyDialog title='选择用户授权' onClose={dlgVisual.Toggle} open={dlgVisual.value} >
            <Form>
                <Form.Item label='被授权人' required>
                    <Controller control={control}
                        name='toUserName'
                        render={({ field }) => <Radio.Group {...field}>
                            {
                                records.value?.myDepartmentMembers.map(item => {
                                    return <Radio key={item.user?.userName} value={item.user?.userName}>{item.user?.name}</Radio>
                                })
                            }
                        </Radio.Group>}></Controller>

                </Form.Item>

                <Form.Item label='时间段'>
                    <DatePicker value={startDatetTimeMonent.value}
                        onSelect={(value) => startDatetTimeMonent.setValue(value)}
                        onChange={(value) => startDatetTimeMonent.setValue(value)}
                        locale={locale}
                        placeholder='开始时间'
                        showTime />
                    <DatePicker value={endDatetTimeMonent.value}
                        onSelect={(value) => endDatetTimeMonent.setValue(value)}
                        onChange={(value) => endDatetTimeMonent.setValue(value)}
                        locale={locale}
                        placeholder='结束时间'
                        showTime />
                    {/*  <Space direction="vertical" size={12}>
                        <RangePicker
                            ranges={{
                                '今天': [moment(), moment()],
                                'This Month': [moment().startOf('month'), moment().endOf('month')],
                            }}
                            locale={locale}
                            showTime
                            format="YYYY/MM/DD HH:mm:ss"
                            onChange={onChange}
                        />
                    </Space> */}
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button onClick={submit} type='primary' htmlType='submit'>确定授权</Button>
                        <Button onClick={dlgVisual.Toggle} type='default'>关闭</Button>
                    </Space>
                </Form.Item>
            </Form>
        </MyDialog>
    </MainLayout>
}