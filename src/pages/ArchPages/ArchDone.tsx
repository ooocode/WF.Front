import { StarFilled, StarOutlined } from "@ant-design/icons"
import { Alert, Breadcrumb, Button, Checkbox, Col, Form, Input, message, Radio, Row, Space, Table } from "antd"
import Search from "antd/lib/input/Search"
import { ColumnsType, TablePaginationConfig } from "antd/lib/table/interface"
import { Link, withPrefix } from "gatsby"

import React, { useEffect, useReducer, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useAsync, useBoolean, useTitle, useToggle } from "react-use"
import { StringUtils } from "../../Commmon/consts"
import { lookTaskMode } from "../../Commmon/task"
import MainLayout from "../../components/MainLayout"
import { tasksClient, userTaskClaimsClient, useUser } from "../../hooks/useApi"
import { useQueryStringParser } from "../../hooks/useQueryStringParser"
import { notificationError } from "../../messageBox"
import { NewestHistoryTask, NewestHistoryTaskTCollectionWithPagination } from "../../WorkFlowApi"


interface ISearchProps {
    pageIndex: number
    pageSize: number
    processDefKey: string
    title?: string
    archNo?: string
    department?: string
    isMyDrafter?: boolean
    createUserDisplayName?: string
    startDate?: Date
    endDate?: Date
}


const ArchDone = () => {
    useTitle('已办查询')
    const query = useQueryStringParser()
    const processDefKey = query.get('processDefKey')
    const { handleSubmit, control, watch, reset, setValue, getValues } = useForm<ISearchProps>()
    const [queryState, setQueryState] = useToggle(false)

    useEffect(() => {
        reset({
            pageIndex: 1,
            pageSize: 10,
            processDefKey: processDefKey ?? ''
        })
        setQueryState()
    }, [processDefKey, setValue, setQueryState])

    const { userName } = useUser()

    const archs = useAsync(async () => {
        if (userName) {
            const value = getValues()
            const processDefKeys = value.processDefKey.split(',').filter(e => !StringUtils.isNullOrEmpty(e))
            const skip = (value.pageIndex - 1) * value.pageSize
            const createUserName = value.isMyDrafter === true ? userName : ''
            const res = await tasksClient.queryNewestHistoryTasks(skip, value.pageSize,
                userName, value.title, createUserName, value.createUserDisplayName, value.department,
                value.startDate, value.endDate, value.archNo, processDefKeys)
            return res
        }
    }, [queryState, userName])

    const handleTableChange = async (page: TablePaginationConfig) => {
        if (page.current) {
            setValue('pageIndex', page.current)
        }
        if (page.pageSize) {
            setValue('pageSize', page.pageSize)
        }
        setQueryState()
    }

    const onOpenTaskBtnClick = (task: NewestHistoryTask) => {
        let mode: lookTaskMode = 'done'
        var href = `/FormPages/FlowForms/${task.processDefKey}?form=${task.processDefKey}&taskId=${task.taskId}&businessKey=${task.businessKey}&mode=${mode}`
        window.open(withPrefix(href))
    }

    const isStar = (item: NewestHistoryTask) => {
        if (item.claims) {
            if (item.claims.findIndex(e => e.type == 'star') > -1) {
                return true
            }
        }
        return false
    }

    const setStar = async (item: NewestHistoryTask, star: boolean) => {
        try {
            await userTaskClaimsClient.setStar(item.businessKey, star)
            message.success('设置星标成功')
            setQueryState()
        } catch (error) {
            notificationError('设置星标出错', error)
        }
    }

    const submit = handleSubmit(async value => {
        setValue('pageIndex', 1)
        setQueryState()
    })

    const columns: ColumnsType<NewestHistoryTask> = [
        {
            title: "缓急",
            render: (task: NewestHistoryTask) => (task.emergencyLevel?.length ?? 0) > 0 ? <span style={{ color: 'red' }}>{task.emergencyLevel}</span> : <></>,
            width: 90
        },
        {
            title: "拟稿人",
            render: (task: NewestHistoryTask) => task.createUserDisplayName,
            width: 80
        },
        {
            title: "发件人",
            render: (task: NewestHistoryTask) => task.senderDisplayName,
            width: 80
        },
        {
            title: "标题",
            render: (task: NewestHistoryTask) => <label onClick={() => onOpenTaskBtnClick(task)} style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                【{task.processDefName}】{task.title?.substr(0, 100)}
                {(task.title?.length ?? 0) > 100 ? '...' : ''}</label>
        }, 
        {
            title: "文号",
            render: (task: NewestHistoryTask) => task.archNo,
            width: 200
        },
        {
            title: "流程状态",
            render: (task: NewestHistoryTask) => task.activityName,
            width: 100
        },
        {
            title: "处理时间",
            render: (task: NewestHistoryTask) => task.dealDateTimeFormat,
            width: 142
        },
        {
            title: "",
            render: (task: NewestHistoryTask) => isStar(task) ? <StarFilled
                onClick={() => setStar(task, false)}
                style={{ color: 'rgb(253,213,74)' }}
                title='取消星标' /> : <StarOutlined onClick={() => setStar(task, true)}
                    style={{ color: 'rgb(180,181,181)' }}
                    title='星标' />,
            width: 20
        },
    ];


    return (<MainLayout>
        {/*  <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item><Link to="/">主页</Link></Breadcrumb.Item>
            <Breadcrumb.Item>已办</Breadcrumb.Item>
        </Breadcrumb> */}

        {archs.error && <Alert
            message="Error"
            description={archs.error.message}
            type="error"
            showIcon
        />}
        <Form>
            {/* <Form.Item label="流程类型">
                    <Radio.Group value={processDefKey}
                        onChange={e => { setPageIndex(1); setProcessDefKey(e.target.value) }}>
                        <Radio value=''>全部</Radio>
                        <Radio value='FWGL'>发文</Radio>
                        <Radio value='BGSSW'>收文</Radio>
                        <Radio value='GWSXSP'>事项审批</Radio>
                        <Radio value='QJGL'>请假</Radio>
                        <Radio value='CCSP'>出差</Radio>
                    </Radio.Group>
                </Form.Item> */}
            <Row gutter={24}>
                <Col span={6}>
                    <Form.Item label="标题">
                        <Controller
                            control={control}
                            name='title'
                            render={({ field }) => <Input allowClear
                                {...field}
                            />} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="文号">
                        <Controller
                            control={control}
                            name='archNo'
                            render={({ field }) => <Input allowClear
                                {...field}
                            />} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="主办单位">
                        <Controller
                            control={control}
                            name='department'
                            render={({ field }) => <Input allowClear
                                {...field}
                            />} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="拟稿人">
                        <Controller
                            control={control}
                            name='createUserDisplayName'
                            render={({ field }) => <Input allowClear
                                {...field}
                            />} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item label="">
                        <Controller
                            control={control}
                            name='isMyDrafter'
                            render={({ field }) => <Checkbox
                                checked={field.value}
                                onChange={e => field.onChange(e)}>只显示我起草的公文</Checkbox>} />

                    </Form.Item>
                </Col>
            </Row>


            {/*   <Row gutter={24}>
                <Col span={8}>
                    <Form.Item label="开始时间">

                        <input type='date'
                            {...register('startDate')}
                        />

                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label="结束时间">
                        <input type='date'
                            {...register('endDate')}
                        />
                    </Form.Item>
                </Col>
                <Col span={8}></Col>
            </Row>
 */}

            <Form.Item label="">
                <Space>
                    <Button type='primary' htmlType='submit' onClick={submit}>查询</Button>
                    <Button onClick={() => { reset({ endDate: undefined, startDate: undefined, pageIndex: 1, pageSize: 10 }); setQueryState() }}>重置条件</Button>
                </Space>
            </Form.Item>
        </Form>
        <hr />

        <Table
            columns={columns}
            rowKey={(record) => record.taskId ?? ""}
            dataSource={archs.value?.value}
            pagination={{
                total: archs.value?.total,
                pageSize: watch('pageSize'),
                current: watch('pageIndex')
            }}
            loading={archs.loading}
            onChange={handleTableChange}
            scroll={{ x: 1300 }}
        />
    </MainLayout>
    )
}

export default ArchDone