import { Alert, Breadcrumb, Button, Col, Form, Input, message, Row, Space, Table, TablePaginationConfig } from "antd"
import React, { useEffect, useState } from "react"
import { lookTaskMode } from "../../Commmon/task"
import { tasksClient, userTaskClaimsClient, useUser } from "../../hooks/useApi"
import { useQueryStringParser } from "../../hooks/useQueryStringParser"
import { useToggle } from "../../hooks/useToggle"
import { MobileTaskList } from "../../WorkFlowApi"
import { Link, withPrefix } from "gatsby"
import MainLayout from "../../components/MainLayout"
import { ColumnsType } from "antd/lib/table"
import Search from "antd/lib/input/Search"
import Tag from "antd/es/tag"
import { useAsync, useIdle, useInterval, useTitle } from "react-use"
import { idleAutoFlushMs, isSSR, mainLayoutEnableReflush, StringUtils } from "../../Commmon/consts"
import { Controller, useController, useForm } from "react-hook-form"
import { StarFilled, StarOutlined } from "@ant-design/icons"
import { notificationError } from "../../messageBox"
import { highlightText } from "../../Commmon/util"

const dealLevels = [
    { name: '其他类型', days: 0 },
    { name: '特急件', days: 1 },
    { name: '加急件', days: 5 },
    { name: '普通一类', days: 12 },
    { name: '普通二类', days: 25 },
    { name: '普通三类', days: 110 },
    { name: '督办件', days: 999 }]

function getEmergencyLevel(emergencyLevel: string) {
    var result = dealLevels.filter(e => e.days.toString() === emergencyLevel)
    if (result.length > 0) {
        emergencyLevel = result[0].name
    }

    if (emergencyLevel.indexOf('急') === -1) {
        emergencyLevel = ''
    }

    return emergencyLevel
}

interface ISearchParams {
    pageIndex: number
    pageSize: number
    title?: string
    archType: string | null
    proDefName: string | null
}


function ArchTodo() {
    const reloadTaskToggle = useToggle()
    const query = useQueryStringParser()
    const t = query.get('t')
    const title = query.get('title')
    const title1 = query.get('title1')
    const archType = query.get('archType')
    const proDefName = query.get('proDefName')

    const { userName } = useUser()
    useTitle(title ?? '')

    const { getValues, control, setValue, watch, reset, handleSubmit } = useForm<ISearchParams>()

    useEffect(() => {
        reset({
            pageIndex: 1,
            pageSize: 30,
            archType: archType,
            proDefName: proDefName
        })
        reloadTaskToggle.Toggle()
    }, [archType, proDefName, reset])

    const onSubmit = handleSubmit(data => {
        setValue('pageIndex', 1)
        reloadTaskToggle.Toggle()
    })


    const onRefresh = () => {
        reset()
        console.log(getValues())
        reloadTaskToggle.Toggle()
    }



    const archs = useAsync(async () => {
        if (userName) {
            const search = getValues()
            let processDefKeys: string[] = []
            if (search.proDefName) {
                processDefKeys = search.proDefName.split(',')
            }

            const res = await tasksClient.queryTodoTaskList(userName,
                (search.pageIndex - 1) * search.pageSize, search.pageSize, false, search.title,
                search.archType ?? '', processDefKeys)

            if (!StringUtils.isNullOrEmpty(search.title)) {
                res.rows?.forEach(item => {
                    if (item.title) {
                        item.title = highlightText(item.title, [search.title ?? ''])
                    }
                })
            }
            return res
        }
    }, [t, reloadTaskToggle.value, getValues, userName])


    useInterval(() => {
        reloadTaskToggle.Toggle()
    }, 20000)

    const isIdle = useIdle(idleAutoFlushMs);
    useEffect(() => {
        if (isIdle) {
            if (!isSSR) {
                message.info('长时间没有操作，自动刷新网页')
                window.location.reload()
            }
        }
    }, [isIdle])

    const onOpenTaskBtnClick = (task: MobileTaskList) => {
        let href: string
        if (task.processDefKey?.startsWith('IPM.')) {
            href = `http://172.26.130.105/OAIIIV3/FormOndo.aspx?FormClass=${task.processDefKey}&ID=${task.taskId?.split('-')[1]}&sView=1&FromOther=1`;
        } else {
            let mode: lookTaskMode = 'todo'
            href = withPrefix(`/FormPages/FlowForms/${task.processDefKey}?form=${task.processDefKey}&taskId=${task.taskId}&businessKey=${task.businessKey}&mode=${mode}`)
        }

        let openWindow = window.open(href)
        let handler = setInterval(() => {
            if (openWindow?.closed) {
                setTimeout(() => {
                    reloadTaskToggle.Toggle()
                    clearInterval(handler)
                }, 500);
            }
        }, 500)
    }

    const getOpenLink = (task: MobileTaskList) => {
        let href: string
        if (task.processDefKey?.startsWith('IPM.')) {
            href = `http://172.26.130.105/OAIIIV3/FormOndo.aspx?FormClass=${task.processDefKey}&ID=${task.taskId?.split('-')[1]}&sView=1&FromOther=1`;
        } else {
            let mode: lookTaskMode = 'todo'
            href = withPrefix(`/FormPages/FlowForms/${task.processDefKey}?form=${task.processDefKey}&taskId=${task.taskId}&businessKey=${task.businessKey}&mode=${mode}`)
        }

        return href
    }

    //1分钟刷新一次
    useInterval(() => {
        if (mainLayoutEnableReflush) {
            if (archs.loading === false) {
                reloadTaskToggle.Toggle()
            }
        }
    }, 1 * 60 * 1000)

    const handleTableChange = (page: TablePaginationConfig) => {
        if (page.current) {
            setValue('pageIndex', page.current)
        }

        if (page.pageSize) {
            setValue('pageSize', page.pageSize)
        }
        reloadTaskToggle.Toggle()
    }

    const isStar = (item: MobileTaskList) => {
        if (item.claims) {
            if (item.claims.findIndex(e => e.type == 'star') > -1) {
                return true
            }
        }
        return false
    }

    const setStar = async (item: MobileTaskList, star: boolean) => {
        try {
            await userTaskClaimsClient.setStar(item.businessKey, star)
            message.success('设置星标成功')
            reloadTaskToggle.Toggle()
        } catch (error) {
            notificationError('设置星标出错', error)
        }
    }

    const columns: ColumnsType<MobileTaskList> = [
        {
            title: "缓急",
            render: (task: MobileTaskList) => (task.emergencyLevel?.length ?? 0) > 0 ? <span style={{ color: 'red' }}>{getEmergencyLevel(task.emergencyLevel ?? '')}</span> : <></>,
            width: 90
        },
        {
            title: "拟稿人",
            render: (task: MobileTaskList) => task.drafterName,
            width: 80
        },
        {
            title: "发件人",
            render: (task: MobileTaskList) => (task.senderName?.indexOf(',') ?? -1) > 0 ? task.senderName?.split(',')[1] : task.senderName,
            width: 80
        },
        {
            title: "标题",
            render: (task: MobileTaskList) => <label onClick={() => onOpenTaskBtnClick(task)}
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                【{task.processDefName}】<span dangerouslySetInnerHTML={{
                    __html: task.title?.substr(0, 100) ?? ''
                }}></span>
                {(task.title?.length ?? 0) > 100 ? '...' : ''}</label>
        },
        {
            title: "文号",
            render: (task: MobileTaskList) => task.archNo,
            width: 200
        },
        {
            title: "流程状态",
            render: (task: MobileTaskList) => <Tag color='processing'>{task.activityName}</Tag>,
            width: 110
        },
        {
            title: "发件时间",
            render: (task: MobileTaskList) => task.createDateTime,
            width: 105
        },
        {
            title: "",
            render: (task: MobileTaskList) => isStar(task) ? <StarFilled
                onClick={() => setStar(task, false)}
                style={{ color: 'rgb(253,213,74)' }}
                title='取消星标' /> : <StarOutlined onClick={() => setStar(task, true)}
                    style={{ color: 'rgb(180,181,181)' }}
                    title='星标' />,
            width: 20
        },
    ];


    return <MainLayout>
        <Breadcrumb>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>{title}{title1}</Breadcrumb.Item>
        </Breadcrumb>

        {archs.error && <Alert
            message="Error"
            description={archs.error.message}
            type="error"
            showIcon
        />}

        <div>
            <Form layout='inline' size='small' style={{ justifyContent: 'right' }}>
                <Form.Item label='标题'>
                    <Controller
                        control={control}
                        name='title'
                        render={({ field }) => <Input {...field} allowClear />} />
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button
                            disabled={archs.loading}
                            type="primary"
                            htmlType='submit'
                            onClick={onSubmit}>
                            查询
                        </Button>

                        <Button
                            disabled={archs.loading}
                            onClick={onRefresh}
                            htmlType='reset'>
                            刷新
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>

        <Table
            columns={columns}
            rowKey={(record: MobileTaskList) => record?.taskId ?? ""}
            dataSource={archs.value?.rows}
            pagination={{ total: archs.value?.total, pageSize: watch('pageSize'), current: watch('pageIndex') }}
            loading={archs.loading}
            onChange={handleTableChange}
            locale={{ emptyText: <></> }}
            scroll={{ x: (archs.value?.total ?? 0) > 0 ? 1300 : undefined }}
        />
    </MainLayout>
}

export default ArchTodo