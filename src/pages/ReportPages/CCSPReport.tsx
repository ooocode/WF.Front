import { StarFilled, StarOutlined } from "@ant-design/icons"
import { Alert, Breadcrumb, Button, Checkbox, Col, Form, Input, message, Radio, Row, Space, Spin, Table, Timeline } from "antd"
import Search from "antd/lib/input/Search"
import { ColumnsType, TablePaginationConfig } from "antd/lib/table/interface"
import { Link, withPrefix } from "gatsby"
import moment from "moment"

import React, { useEffect, useReducer, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useAsync, useBoolean, useTitle, useToggle } from "react-use"
import { StringUtils, workFlowBaseUrl } from "../../Commmon/consts"
import { lookTaskMode } from "../../Commmon/task"
import MainLayout from "../../components/MainLayout"
import { fetchClient, tasksClient, userTaskClaimsClient, useUser } from "../../hooks/useApi"
import { useQueryStringParser } from "../../hooks/useQueryStringParser"
import { notificationError } from "../../messageBox"
import { DailyCCSPItem, NewestHistoryTask, NewestHistoryTaskTCollectionWithPagination, ReportsClient } from "../../WorkFlowApi"


const reportsClient = new ReportsClient(workFlowBaseUrl, { fetch: fetchClient })

interface IQueryParams {
    startDate: Date
    endDate: Date
}

const CCSPReport = () => {
    useTitle('公文监控-出差申请')
    const [reload, setReload] = useToggle(false)
    const { getValues, setValue, reset, watch } = useForm<IQueryParams>({
        defaultValues: {
            startDate: new Date(`${new Date().getFullYear()}/${new Date().getMonth()}/1`),
            endDate: new Date(`${new Date().getFullYear()}/${new Date().getMonth() + 1}/1`),
        }
    })


    const data = useAsync(async () => {
        const query = getValues()
        const res = await reportsClient.getCCSPReport(query.startDate, query.endDate)
        return res
    }, [reload, getValues])

    //本月
    const onClickThisMonth = () => {
        reset({
            startDate: new Date(`${new Date().getFullYear()}/${new Date().getMonth()}/1`),
            endDate: new Date(`${new Date().getFullYear()}/${new Date().getMonth() + 1}/1`),
        })
        setReload()
    }

    //上个月
    const onClickPreMonth = () => {
        reset({
            startDate: moment(watch('startDate')).subtract(1, 'M').toDate(),
            endDate: moment(watch('endDate')).subtract(1, 'M').toDate(),
        })
        setReload()
    }

    const openTask = (businessKey: string) => {
        let mode: lookTaskMode = 'common'
        var prodefKey = 'CCSP'
        var href = `/FormPages/FlowForms/${prodefKey}?form=${prodefKey}&businessKey=${businessKey}&mode=${mode}`
        window.open(withPrefix(href))
    }


    return (<MainLayout>
        {data.loading === true ? <Spin /> : <>
            <Space>
                <Button type='primary' onClick={onClickThisMonth}>本月</Button>
                <Button onClick={onClickPreMonth}>上一个月</Button>
            </Space>
            <hr />
            <Alert message={<p>{watch('startDate').toLocaleDateString()}~{watch('endDate').toLocaleDateString()} 申请出差总人数：{data.value?.totalPersonCount}</p>}></Alert>
            <hr />
            <div style={{ marginTop: 10 }}>
                <Timeline mode='left'>
                    {data.value?.dailyCCSPItems?.map(item => {
                        return item.items?.map(e => {
                            return <Timeline.Item>
                                <p>{e.createDateTimeFormat} [{e.unit}] {e.persons} {e.personCount}人</p>
                                <p>出差时间：<span style={{ color: "red" }}>{e.startDateTimeFormat}~{e.endDateTimeFormat}</span></p>
                                <p>出差原因：<label onClick={() => openTask(e.businessKey ?? '')}
                                    style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                                    {e.title}
                                </label></p>
                            </Timeline.Item>
                        })
                    })}
                </Timeline>
            </div>
        </>}




        {/*  <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item><Link to="/">主页</Link></Breadcrumb.Item>
            <Breadcrumb.Item>已办</Breadcrumb.Item>
        </Breadcrumb> */}

        {/*  {archs.error && <Alert
            message="Error"
            description={archs.error.message}
            type="error"
            showIcon
        />} */}
        {/*     <Form>
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


              <Row gutter={24}>
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
        /> */}
    </MainLayout>
    )
}

export default CCSPReport