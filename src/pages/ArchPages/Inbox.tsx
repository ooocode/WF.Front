import { Alert, Breadcrumb, Button, Checkbox, Form, Input, List, message, Select, Space, Spin, Table, Tag, Tooltip } from "antd"
import React, { useContext, useEffect, useState } from "react"
import { lookTaskMode } from "../../Commmon/task"
import { inboxClient, processInstancesClient, usersClient, useUser } from "../../hooks/useApi"
import { IuseToggleResult, useStateEx, useToggle } from "../../hooks/useToggle"
import { messageBox } from "../../messageBox"
import { ITodoTaskViewModel, BusinessForm, HistoryProcesseInstance, StartProcessDefinitionViewModel, FormField, IFormField, UserReply } from "../../WorkFlowApi"
import { Link } from "gatsby"
import MainLayout from "../../components/MainLayout"
import Search from "antd/lib/input/Search"
import moment from "moment"
import { IInboxViewModel, InboxAssigneeViewModel, InboxDetailViewModel } from "../../../apis/GWExchange"
import { ColumnsType, TablePaginationConfig } from "antd/lib/table"
import MyDialog from "../../components/MyDialog"
import { createContext } from "react"
import { use } from "echarts"
import { useAsync, useInterval, useTitle } from "react-use"
import { Controller, useForm } from "react-hook-form"
const { Option } = Select;

const SelectedInboxContext = createContext<IInboxViewModel | undefined>(undefined)

const assigneeArch = async (id: string, user: UserReply) => {
    let vm = new InboxAssigneeViewModel()
    vm.id = id
    vm.assigneeUserName = user.userName
    vm.assigneeDisplayName = user.name
    vm.assigneeDepartment = user.mainDepatment
    vm.assigneePhoneNumber = user.phoneNumber
    await inboxClient.inboxAssignee(vm)
}


interface ISearchParams {
    pageIndex: number
    pageSize: number
    title?: string,
    department?: string
    archType?: string
    archNo?: string
    onlyShowNotAssigneed?: boolean
}

export default function Inbox() {
    const reloadTaskToggle = useToggle()
    const dlgState = useToggle()
    const selectedItem = useStateEx<IInboxViewModel | undefined>(undefined)
    const processing = useStateEx(false)

    useTitle('收件箱')
    const { userName } = useUser()

    const { control, handleSubmit, getValues, setValue, watch, reset } = useForm<ISearchParams>({
        defaultValues: {
            pageIndex: 1,
            pageSize: 10
        }
    })

    const submit = handleSubmit(data => {
        console.log(data)
        setValue('pageIndex', 1)
        reloadTaskToggle.Toggle()
    })


    const state = useAsync(async () => {
        const data = getValues()
        const skip = (data.pageIndex - 1) * data.pageSize
        const res = await inboxClient.getInboxList(skip, data.pageSize, data.title, data.department, data.archNo, data.archType, data.onlyShowNotAssigneed, undefined, undefined)
        return res
    }, [reloadTaskToggle.value, getValues])

    const handleTableChange = async (page: TablePaginationConfig) => {
        setValue('pageIndex', page.current ?? 1)
        setValue('pageSize', page.pageSize ?? 10)
        reloadTaskToggle.Toggle()
    }


    useInterval(() => {
        reloadTaskToggle.Toggle()
    }, 30000)


    const openTask = (task: IInboxViewModel) => {
        selectedItem.setValue(task)
        dlgState.Toggle()
    }

    const assignee = async (item: IInboxViewModel) => {
        if (processing.value) {
            return
        }

        processing.setValue(true)
        try {
            if (userName && item.id) {
                var user = await usersClient.getUserByUserName(userName)
                await assigneeArch(item.id, user)
                message.success('签收成功')
                reloadTaskToggle.Toggle()
            }
        } catch (error) {
            messageBox(error)
        }

        processing.setValue(false)
    }

    const columns: ColumnsType<IInboxViewModel> = [
        {
            title: "紧急程度",
            render: (task: IInboxViewModel) => <span style={{ color: 'red' }}>{task.emergencyLevel}</span>,
            width: 90
        },
        {
            title: "发文机关",
            render: (instance: IInboxViewModel) => instance.fromUnitName,
            width: 90
        },
        {
            title: "签发人",
            render: (instance: IInboxViewModel) => instance.leaderDisplayName,
            width: 90
        },
        {
            title: "标题",
            render: (instance: IInboxViewModel) => <label onClick={() => openTask(instance)}
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                {instance.archType === "0" && <Tag color='blue'>办件</Tag>}
                {instance.archType !== "0" && <Tag color='success'>阅件</Tag>}
                {instance.title?.substr(0, 100)}
                {(instance.title?.length ?? 0) > 100 ? '...' : ''}</label>
        },
        {
            title: "文号",
            render: (instance: IInboxViewModel) => instance.referenceNumber,
            width: 200
        },
        {
            title: "时间要求",
            render: (instance: IInboxViewModel) => instance.maxEndDateTimeFormat,
            width: 145
        }, {
            title: "发送时间",
            render: (instance: IInboxViewModel) => instance.createDateTimeFormat,
            width: 145
        },
        {
            title: "签收情况",
            render: (instance: IInboxViewModel) => instance.assigneeDateTime !== undefined
                ? <Tooltip placement="topLeft" title={`${instance.assigneePerson} ${instance.assigneeDateTime.toLocaleString()}`} arrowPointAtCenter>
                    <Tag color='green'>已签收</Tag> </Tooltip> : <>{processing.value ? <Spin></Spin> : <Tag color='red' style={{ cursor: 'pointer' }} onClick={() => assignee(instance)}>未签收</Tag>}</>,
            width: 100
        },
        {
            title: "处理情况",
            render: (instance: IInboxViewModel) => instance.feedbackDateTime !== undefined
                ? <><Tooltip placement="topLeft" title={`${instance.feedbackUserDisplayName} ${instance.feedbackOpinion}`} arrowPointAtCenter>
                    <Tag color='green'>已反馈</Tag>
                </Tooltip></> : <Tag color='red'>未反馈</Tag>,
            width: 100
        },
    ];



    return <MainLayout>
        {/*  <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item><Link to="/">主页</Link></Breadcrumb.Item>
            <Breadcrumb.Item>公文监控</Breadcrumb.Item>
        </Breadcrumb> */}
        {state.error && <Alert
            message="Error"
            description={state.error.message}
            type="error"
            showIcon
        />}

        <h5>公文交换-收件箱</h5>
        <div>
            <Form layout='inline'>
                <Form.Item label="来文类型">
                    <Controller control={control}
                        name='archType'
                        render={({ field }) => <Select {...field} style={{ width: 200 }}>
                            <Option value="">全部类型</Option>
                            <Option value="0">办件</Option>
                            <Option value="1">阅件</Option>
                        </Select>} />
                </Form.Item>

                <Form.Item label="标题">
                    <Controller control={control}
                        name='title'
                        render={({ field }) => <Input {...field} placeholder="" allowClear />} />
                </Form.Item>

                <Form.Item label="文号">
                    <Controller control={control}
                        name='archNo'
                        render={({ field }) => <Input {...field} placeholder="" allowClear />} />
                </Form.Item>

                <Form.Item label="发文机关">
                    <Controller control={control}
                        name='department'
                        render={({ field }) => <Input {...field} placeholder="" allowClear />} />
                </Form.Item>

                <Form.Item label="签收情况">
                    <Controller control={control}
                        name='onlyShowNotAssigneed'
                        render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange}>只显示未签收</Checkbox>}></Controller>
                </Form.Item>


                <Form.Item label="">
                    <Space>
                        <Button htmlType='submit' onClick={submit} type='primary'>查询</Button>
                        <Button htmlType='reset' onClick={() => { reset(); reloadTaskToggle.Toggle() }}>重置</Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>

        <Table
            columns={columns}
            rowKey={(record: IInboxViewModel) => record.id ?? ""}
            dataSource={state.value?.value}
            pagination={{ total: state.value?.total, pageSize: watch('pageSize') }}
            loading={state.loading}
            onChange={handleTableChange}
            scroll={{ x: 1300 }}
        />

        <SelectedInboxContext.Provider value={selectedItem.value}>
            <InboxDetailDlg id={selectedItem.value?.id} visual={dlgState} />
        </SelectedInboxContext.Provider>
    </MainLayout>
}


function InboxDetailDlg({ id, visual }: { id: string | undefined, visual: IuseToggleResult }) {
    const detail = useStateEx<InboxDetailViewModel | undefined>(undefined)
    const loading = useStateEx(true)
    const selectedInbox = useContext(SelectedInboxContext)
    const { userName } = useUser()

    const assginee = async () => {
        try {
            if (userName) {
                const user = await usersClient.getUserByUserName(userName)
                if (user !== null && selectedInbox?.id) {
                    await assigneeArch(selectedInbox.id, user)
                    visual.Toggle()
                    message.success('签收成功')
                }
            }
        } catch (error) {
            messageBox(error)
        }
    }

    useEffect(() => {
        if (id) {
            loading.setValue(true)
            inboxClient.getInboxDetail(id).then(res => {
                detail.setValue(res)
            }).catch(err => {
                detail.setValue(undefined)
            }).finally(() => {
                loading.setValue(false)
            })
        }
    }, [id])

    return <MyDialog open={visual.value} onClose={visual.Toggle} title={detail.value?.inbox?.title ?? ''}>
        {loading.value === true ? <Spin /> : <>
            <List
                size="small"
                //header={<div>Header</div>}
                //footer={<div>Footer</div>}
                locale={{ emptyText: <></> }}
                dataSource={detail.value?.files?.value ?? []}
                renderItem={(file, index) => <p><a onClick={() => window.open(file.downloadUrl)} style={{ color: '#0000ee', fontSize: 16 }}>
                    {index + 1}、{file.name}
                </a></p>}
            />
            <Button onClick={assginee}>签收</Button>
        </>}
    </MyDialog>
}