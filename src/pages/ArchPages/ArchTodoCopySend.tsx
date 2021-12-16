import { Breadcrumb, Button, Space, Table, TablePaginationConfig } from "antd"
import React, { useEffect, useState } from "react"
import { lookTaskMode } from "../../Commmon/task"
import { tasksClient, useUser } from "../../hooks/useApi"
import { useQueryStringParser } from "../../hooks/useQueryStringParser"
import { useToggle } from "../../hooks/useToggle"
import { messageBox } from "../../messageBox"
import { MobileTaskListPaginationResult, MobileTaskList } from "../../WorkFlowApi"
import { Link, withPrefix } from "gatsby"
import MainLayout from "../../components/MainLayout"
import { ColumnsType } from "antd/lib/table"
import Search from "antd/lib/input/Search"
import Tag from "antd/es/tag"
import { useAsync, useInterval, useTitle } from "react-use"
import { ReloadOutlined } from "@ant-design/icons"
import { mainLayoutEnableReflush, mainLayoutLoadCountIntervalMS } from "../../Commmon/consts"

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


function ArchTodoCopySend() {
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize] = useState(30)
    const [search, setSearch] = useState<string>('')
    const reloadTaskToggle = useToggle()
    const query = useQueryStringParser()
    const proDefName = 'Process_System_CopySend'
    const archType = query.get('archType')
    const title = query.get('title')
    const title1 = query.get('title1')

    useTitle(title ?? '')

    const { userName } = useUser()

    const state = useAsync(async () => {
        if (userName) {
            let processDefKeys: string[] = []
            if (proDefName && proDefName.length > 0) {
                processDefKeys = proDefName.split(',')
            }

            const res = await tasksClient.queryTodoTaskList(userName,
                (pageIndex - 1) * pageSize, pageSize, undefined, search, archType ?? '', processDefKeys)
            return res
        }
    }, [pageIndex, pageSize, search, archType, proDefName, reloadTaskToggle.value, userName])


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

    //1分钟刷新一次
    useInterval(() => {
        if (mainLayoutEnableReflush) {
            if (state.loading === false) {
                reloadTaskToggle.Toggle()
            }
        }
    }, 1 * 60 * 1000)

    const handleTableChange = async (page: TablePaginationConfig) => {
        setPageIndex(page.current ?? 1)
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
            title: "文号",
            render: (task: MobileTaskList) => task.archNo,
            width: 120
        },
        {
            title: "标题",
            render: (task: MobileTaskList) => <label onClick={() => onOpenTaskBtnClick(task)}
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                【{task.processDefName}】{task.title?.substr(0, 100)}
                {(task.title?.length ?? 0) > 100 ? '...' : ''}</label>
        },
        {
            title: "流程状态",
            render: (task: MobileTaskList) => <Tag color='processing'>{task.activityName}</Tag>,
            width: 110
        },
        {
            title: "发件时间",
            render: (task: MobileTaskList) => task.createDateTime,
            width: 100
        },
    ];



    return <MainLayout>
        <Breadcrumb>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>{title}{title1}</Breadcrumb.Item>
        </Breadcrumb>

        <div style={{ textAlign: "right" }}>
            <Search
                disabled={state.loading}
                onSearch={setSearch} enterButton
                allowClear
                style={{ width: 200 }} placeholder='标题查询' />
            <Button
                disabled={state.loading}
                onClick={reloadTaskToggle.Toggle}
                type="primary"
                style={{ marginLeft: 10 }}>
                刷新
            </Button>
        </div>


        <Table
            columns={columns}
            rowKey={(record: MobileTaskList) => record?.taskId ?? ""}
            dataSource={state.value?.rows}
            pagination={{ total: state.value?.total, pageSize: pageSize }}
            loading={state.loading}
            onChange={handleTableChange}
        />
    </MainLayout>
}

export default ArchTodoCopySend