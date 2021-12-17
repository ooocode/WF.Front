import { Alert, Breadcrumb, Button, Checkbox, Col, DatePicker, Form, Input, Radio, Row, Select, Space, Table, TablePaginationConfig, Tag } from "antd"
import React, { createRef, useEffect, useState } from "react"
import { lookTaskMode } from "../../Commmon/task"
import { attachmentsManagerClient, processInstancesClient, useUser } from "../../hooks/useApi"
import { useStateEx, useToggle } from "../../hooks/useToggle"
import { messageBox } from "../../messageBox"
import { AttachmentManagerItem, BusinessForm, FormAttachmentDto, HistoryProcesseInstance } from "../../WorkFlowApi"
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

//import hljs from 'highlight.js';
//import 'highlight.js/styles/github.css';
//import javascript from 'highlight.js/lib/languages/';
//hljs.registerLanguage('javascript', javascript);


interface IQueryParams {
    pageIndex: number
    pageSize: number
    fileNameStartWith: string
    fileNameEndWith: string
    fileNameContains: string
    processDefKey: string
}

function highlightText(text: string, keywords: string[]) {
    keywords.forEach(keyword => {
        text = text.replace(keyword, `<span style="color:red">${keyword}</span>`)
    })
    return text
}

export default function AttachmentsManagerPage() {
    const reloadTaskToggle = useToggle()
    const route = useQueryStringParser()

    useTitle('搜索附件')
    const { userName } = useUser()

    const { getValues, setValue, reset, control, watch, handleSubmit } = useForm<IQueryParams>({
        defaultValues: {
            pageIndex: 1,
            pageSize: 10,
            processDefKey: ""
        }
    })


    const archs = useAsync(async () => {
        const value = getValues()
        var processDefKeys = value.processDefKey.split(',').filter(e => !StringUtils.isNullOrEmpty(e))
        var offset = (value.pageIndex - 1) * value.pageSize
        const res = await attachmentsManagerClient.queryFormAttachments('', value.fileNameStartWith,
            value.fileNameEndWith, value.fileNameContains, offset, value.pageSize, processDefKeys)

        res.value?.forEach(element => {
            if (element.originFileName) {
                element.originFileName = highlightText(element.originFileName, [value.fileNameStartWith, value.fileNameEndWith, value.fileNameContains])
            }
        });

        return res
    }, [reloadTaskToggle.value, userName])


    const handleTableChange = async (page: TablePaginationConfig) => {
        setValue('pageIndex', page.current ?? 1)
        reloadTaskToggle.Toggle()
    }

    const onReset = () => {
        reset({
            pageIndex: 1,
            pageSize: 10,
            fileNameStartWith: "",
            fileNameEndWith: "",
            fileNameContains: "",
            processDefKey: ''
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

    const openTask = (processDefKey: string, businessKey: string) => {
        let mode: lookTaskMode = 'common'
        var href = `/FormPages/FlowForms/${processDefKey}?form=${processDefKey}&businessKey=${businessKey}&mode=${mode}`
        window.open(withPrefix(href))
    }



    const columns: ColumnsType<AttachmentManagerItem> = [
        {
            title: <span style={{ color: 'red' }}>附件名</span>,
            render: (item: AttachmentManagerItem) => <span dangerouslySetInnerHTML={{
                __html: item.originFileName ?? ''
            }}></span>,
            width: 300
        },
        {
            title: "对应的公文",
            render: (item: AttachmentManagerItem) => item.formTitle && <label
                onClick={() => openTask(item.processDefKey ?? '', item.businessKey ?? '')}
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                【{item.processDefName}】{item.formTitle?.trim()}</label>
        },
        {
            title: "单位",
            render: (item: AttachmentManagerItem) => item.displayDepartment,
            width: 200
        },
        /*   , {
              title: <span style={{ color: 'red' }}>时间</span>,
              render: (item: AttachmentManagerItem) => item.createDateTimeFormat,
              width: 130
          }, */
        /* {
            title: "文号",
            render: (instance: AttachmentManagerItem) => instance.archNo,
            width: 200
        },
        {
            title: "来文单位",
            render: (instance: AttachmentManagerItem) => instance?.displayDepartment?.trim()?.replace('区市监局/', ''),
            width: 200
        },
        {
            title: "流程状态",
            render: (instance: AttachmentManagerItem) => <StateTag state={instance.state ?? ''}></StateTag>,
            width: 100
        },
        {
            title: "开始时间",
            render: (instance: AttachmentManagerItem) => instance.startTimeFormat,
            width: 105
        }, */
    ];

    return <MainLayout>
        <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item><Link to="/">主页</Link></Breadcrumb.Item>
            <Breadcrumb.Item>附件搜索</Breadcrumb.Item>
        </Breadcrumb>

        <div>
            <Form style={{ marginTop: 5 }}>
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item label="标题查询">
                            <Controller control={control} name='fileNameContains'
                                render={({ field }) => <Input style={{ marginTop: 3 }}
                                    allowClear {...field}
                                    addonBefore='附件包含'
                                    addonAfter='关键字' />} />

                            <Controller control={control} name='fileNameStartWith'
                                render={({ field }) => <Input style={{ marginTop: 3 }}
                                    allowClear {...field}
                                    addonBefore='附件以'
                                    addonAfter='开头' />} />

                            <Controller control={control} name='fileNameEndWith'
                                render={({ field }) => <Input style={{ marginTop: 3 }}
                                    allowClear {...field}
                                    addonBefore='附件以'
                                    addonAfter='结尾' />} />
                        </Form.Item>
                    </Col>


                    <Col span={8}>
                        <Form.Item label="公文类型">
                            <Controller control={control} name='processDefKey'
                                render={({ field }) => <Radio.Group {...field}>
                                    <Space direction="vertical">
                                        <Radio value={''}>全部</Radio>
                                        <Radio value={'FWGL,IPM.WF.XFWGL'}>发文</Radio>
                                        <Radio value={'BGSSW,IPM.WF.XBGSSW'}>收文</Radio>
                                        <Radio value={'GWSXSP,IPM.WF.GWSXSP'}>事项审批</Radio>
                                    </Space>
                                </Radio.Group>} />
                        </Form.Item>
                    </Col>

















                    {/*  <Col span={6}>

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
                    </Col> */}
                </Row>

                <Row gutter={24}>
                    {/* <Col span={6}>
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
                    </Col> */}

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
                rowKey={(record: AttachmentManagerItem) => record.id ?? ""}
                dataSource={archs.value?.value ?? []}
                pagination={{ total: archs.value?.total, pageSize: watch('pageSize'), current: watch('pageIndex') }}
                loading={archs.loading}
                onChange={handleTableChange}
                scroll={{ x: 1300 }}
            />
        </div>
    </MainLayout>
}