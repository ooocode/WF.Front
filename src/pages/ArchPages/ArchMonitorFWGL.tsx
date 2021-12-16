import { Alert, Breadcrumb, Button, Checkbox, Col, DatePicker, Form, Input, Row, Select, Space, Table, TablePaginationConfig, Tag } from "antd"
import React, { createRef, useEffect, useState } from "react"
import { lookTaskMode } from "../../Commmon/task"
import { processInstancesClient, useUser } from "../../hooks/useApi"
import { useStateEx, useToggle } from "../../hooks/useToggle"
import { messageBox } from "../../messageBox"
import { BusinessForm, HistoryProcesseInstance } from "../../WorkFlowApi"
import MainLayout from "../../components/MainLayout"
import Search from "antd/lib/input/Search"
import { ColumnsType } from "antd/lib/table"
import { Link, withPrefix } from "gatsby"
import { useAsync, useError, useTitle } from "react-use"
import { useQueryStringParser } from "../../hooks/useQueryStringParser"
import { Controller, useForm } from "react-hook-form"
import { StringUtils } from "../../Commmon/consts"
const { Option } = Select;
import 'moment/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';
import moment from "moment"

const processDefKeys: Map<string, string> = new Map<string, string>([
    ['', '全部流程'],
    ['GWSXSP', '公务事项审批'],
    ['CCSP', '出差审批'],
    ['QJGL', '请假管理'],
    ['FWGL', '发文管理'],
    ['BGSSW', '办公室收文'],
])

interface IQueryParams {
    pageIndex: number
    pageSize: number
    titleLike?: string
    drafterNameLike?: string
    onlyShowMeDrafter?: boolean
    onlyShowFinishedFlows?: boolean
    archNoLike?: string
    proDefKey: string
    startDate?: Date
    endDate?: Date
}

const ArchMonitorFWGL = () => {
    const reloadTaskToggle = useToggle()
    const route = useQueryStringParser()
    const proDefKeysString = route.get('proDefKeys')

    useTitle('公文监控')
    const { userName } = useUser()

    const { getValues, setValue, reset, control, watch, handleSubmit } = useForm<IQueryParams>({
        defaultValues: {
            pageIndex: 1,
            pageSize: 10,
            startDate: undefined,
            endDate: undefined
        }
    })


    useEffect(() => {
        setValue('pageIndex', 1)
    }, [proDefKeysString])


    const archs = useAsync(async () => {
        const value = getValues()

        let proDefKeys: string[] = []
        if (!StringUtils.isNullOrEmpty(proDefKeysString)) {
            proDefKeys = proDefKeysString?.split(',').filter(e => !StringUtils.isNullOrEmpty(e)) ?? []
        }

        const res = await processInstancesClient.getHistoryProcesseInstances((value.pageIndex - 1) * value.pageSize, value.pageSize, value.titleLike,
            value.startDate, value.endDate,
            value.onlyShowFinishedFlows, value.onlyShowMeDrafter === true ? userName : undefined, value.drafterNameLike,
            value.archNoLike, proDefKeys)
        return res
    }, [reloadTaskToggle.value, proDefKeysString, userName])


    const handleTableChange = async (page: TablePaginationConfig) => {
        setValue('pageIndex', page.current ?? 1)
        reloadTaskToggle.Toggle()
    }

    const onReset = () => {
        reset({
            pageIndex: 1,
            pageSize: 10,
            titleLike: undefined,
            archNoLike: undefined,
            drafterNameLike: undefined,
            onlyShowFinishedFlows: undefined,
            onlyShowMeDrafter: undefined
        })
        reloadTaskToggle.Toggle()
    }


    const submit = handleSubmit(data => {
        data.pageIndex = 1
        reset(data)
        reloadTaskToggle.Toggle()
    })


    const StateTag = ({ state }: { state: string }) => {
        if (state === "COMPLETED") {
            return <Tag color="success">已完成</Tag>
        }

        return <Tag color="red">{state}</Tag>
    }

    const openTask = (form: BusinessForm | undefined) => {
        let mode: lookTaskMode = 'common'
        var prodefKey = form?.processDefKey
        var href = `/FormPages/FlowForms/${prodefKey}?form=${prodefKey}&businessKey=${form?.businessKey}&mode=${mode}`
        window.open(withPrefix(href))
    }

    const columns: ColumnsType<HistoryProcesseInstance> = [
        {
            title: "紧急程度",
            render: (task: HistoryProcesseInstance) => (task.emergencyLevel?.length ?? 0) > 0 ? <span style={{ color: 'red' }}>{task.emergencyLevel}</span> : <></>,
            width: 90
        },
        {
            title: "标题",
            render: (instance: HistoryProcesseInstance) => <label onClick={() => openTask(instance.form)}
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                【{instance.form?.processDefName}】{instance.form?.title?.substr(0, 100)}
                {(instance.form?.title?.length ?? 0) > 100 ? '...' : ''}</label>
        },
        {
            title: "文号",
            render: (instance: HistoryProcesseInstance) => instance.archNo,
            width: 200
        },
        {
            title: "来文单位",
            render: (instance: HistoryProcesseInstance) => instance?.displayDepartment?.trim()?.replace('区市监局/', ''),
            width: 200
        },
        {
            title: "流程状态",
            render: (instance: HistoryProcesseInstance) => <StateTag state={instance.state ?? ''}></StateTag>,
            width: 100
        },
        {
            title: "开始时间",
            render: (instance: HistoryProcesseInstance) => instance.startTimeFormat,
            width: 105
        },
    ];

    return <MainLayout>
        <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item><Link to="/">主页</Link></Breadcrumb.Item>
            <Breadcrumb.Item>公文监控</Breadcrumb.Item>
        </Breadcrumb>

        <div>
            <div style={{ textAlign: 'right' }}>
                <Button type='ghost' onClick={() => window.open('http://172.26.130.105:4096/ArchPages/ArchMonitorNoLayout')}>前往查询2020年及以前的收发文</Button>
            </div>
            <Form style={{ marginTop: 5 }}>
                {/*  <Form.Item label="流程选择">
                    <Select value={proDefKey} style={{ width: 200 }} onChange={(e) => setProDefKey(e)}>
                        <Option value="">全部流程</Option>
                        <Option value="GWSXSP">公务事项审批</Option>
                        <Option value="CCSP">出差审批</Option>
                        <Option value="QJGL">请假管理</Option>
                        <Option value="FWGL">发文管理</Option>
                        <Option value="BGSSW">办公室收文</Option>
                    </Select>
                </Form.Item> */}
                <Row gutter={24}>
                    <Col span={6}>
                        <Form.Item label="标题查询">
                            <Controller control={control} name='titleLike'
                                render={({ field }) => <Input allowClear {...field} />} />
                        </Form.Item>
                    </Col>

                    <Col span={6}>

                        <Form.Item label="文号">
                            <Controller control={control} name='archNoLike'
                                render={({ field }) => <Input allowClear {...field} />} />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item label="拟稿人查询">
                            <Controller control={control} name='drafterNameLike'
                                render={({ field }) => <Input allowClear {...field} />} />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item>
                            <Controller control={control} name='onlyShowFinishedFlows'
                                render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange}>已完成的流程</Checkbox>} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={6}>
                        <Form.Item>
                            <Controller control={control} name='onlyShowMeDrafter'
                                render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange}>我起草的公文</Checkbox>} />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item label="开始时间">
                            <DatePicker locale={locale}
                                value={watch('startDate') ? moment(watch('startDate')) : null}
                                onChange={e => { setValue('startDate', e === null ? undefined : e?.toDate()) }} />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item label="结束时间">
                            <DatePicker locale={locale}
                                value={watch('endDate') ? moment(watch('endDate')) : null}
                                onChange={e => { setValue('endDate', e === null ? undefined : e?.toDate()) }} />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item label="">
                            <Space>
                                <Button type='primary' htmlType='submit' onClick={submit}>查询</Button>
                                <Button onClick={onReset}>重置条件</Button>
                            </Space>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            <Table
                columns={columns}
                rowKey={(record: HistoryProcesseInstance) => record.id ?? ""}
                dataSource={archs.value?.rows}
                pagination={{ total: archs.value?.total, pageSize: watch('pageSize'), current: watch('pageIndex') }}
                loading={archs.loading}
                onChange={handleTableChange}
                scroll={{ x: 1300 }}
            />
        </div>
    </MainLayout>
}


export default ArchMonitorFWGL