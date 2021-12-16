import { Checkbox, Form, Select, Table, TablePaginationConfig, Tag } from "antd"
import React, { useEffect, useState } from "react"
import { lookTaskMode } from "../../Commmon/task"
import { processInstancesClient, useUser } from "../../hooks/useApi"
import { useStateEx, useToggle } from "../../hooks/useToggle"
import { messageBox } from "../../messageBox"
import { BusinessForm, HistoryProcesseInstance } from "../../WorkFlowApi"
import MainLayout from "../../components/MainLayout"
import Search from "antd/lib/input/Search"
import { ColumnsType } from "antd/lib/table"
import { withPrefix } from "gatsby"
import { useAsync, useTitle } from "react-use"
const { Option } = Select;

const processDefKeys = [
    { key: '', name: '全部流程' },
    { key: 'IPM.WF.XFWGL', name: '新发文管理' },
    { key: 'IPM.WF.XBGSSW', name: '新办公室收文' },
    { key: 'IPM.WF.GWSXSP', name: '公务事项审批' },
    { key: 'IPM.WF.FWGL', name: '(旧)发文管理' },
    { key: 'IPM.WF.BGSSW', name: '(旧)办公室收文' },
]

const title = "公文监控"

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
    } else {
        result = dealLevels.filter(e => parseInt(emergencyLevel) > e.days)
        emergencyLevel = result[0].name
    }


    return emergencyLevel
}



function ArchMonitorOld() {
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize] = useState(10)
    const reloadTaskToggle = useToggle()
    const [search, setSearch] = useState<string>('')
    const [proDefKey, setProDefKey] = useState<string>('')
    const onlyShowFinishedFlows = useToggle();
    const drafterUserName = useStateEx('')
    const drafterName = useStateEx('')
    const onlyShowMeDrafter = useToggle()
    const [year, setYear] = useState(new Date().getFullYear())
    const [years] = useState(() => {
        let y: number[] = []
        for (let index = 2009; index <= new Date().getFullYear(); index++) {
            y.push(index)
        }
        return y.reverse()
    })

    useTitle(title)

    const { userName } = useUser()

    const archs = useAsync(async () => {
        let drafterUserNameValue = drafterUserName.value
        if (onlyShowMeDrafter.value === true) {
            drafterUserNameValue = userName ?? ''
        }

        return await processInstancesClient.getHistoryProcesseInstancesForOldOA(year, (pageIndex - 1) * pageSize, pageSize,
            proDefKey, search, undefined, undefined, onlyShowFinishedFlows.value, drafterUserNameValue, drafterName.value)
    }, [year, pageIndex, pageSize, reloadTaskToggle.value, proDefKey, search, onlyShowFinishedFlows.value, drafterUserName.value,
        drafterName.value, onlyShowMeDrafter.value, userName])




    const handleTableChange = async (page: TablePaginationConfig) => {
        setPageIndex(page.current ?? 1)
    }

    const StateTag = ({ state }: { state: string }) => {
        if (state === "完成" || state === '归档' || state === '发文结束' || state == '结束归档') {
            return <Tag color="success">{state}</Tag>
        }

        return <Tag color="red">{state}</Tag>
    }

    const openTask = (instance: HistoryProcesseInstance) => {
        var href = `http://172.26.130.105/OAIIIV3/FormOndo.aspx?FormClass=${instance.form?.processDefKey}&doneDraftTime=${year}&doneDrafter=&ID=${instance.id}&doneArchID=${instance.form?.businessKey}&sView=5&FromOther=1`
        window.open(withPrefix(href))
    }

    const columns: ColumnsType<HistoryProcesseInstance> = [
        {
            title: "紧急程度",
            render: (task: HistoryProcesseInstance) => (task.emergencyLevel?.length ?? 0) > 0 ? <span style={{ color: 'red' }}>{getEmergencyLevel(task.emergencyLevel ?? '')}</span> : <></>,
            width: 90
        },
        {
            title: "标题",
            render: (instance: HistoryProcesseInstance) => <label onClick={() => openTask(instance)}
                style={{ wordBreak: "break-word", color: "#1890FF", cursor: 'pointer' }}>
                【{instance.form?.processDefName}】{instance.form?.title?.substr(0, 100)}
                {(instance.form?.title?.length ?? 0) > 100 ? '...' : ''}</label>
        },
        {
            title: "来文单位",
            render: (instance: HistoryProcesseInstance) => instance?.form?.drafterDepartment?.split('/')?.reverse()[0],
            width: 120
        },

        {
            title: "文号",
            render: (instance: HistoryProcesseInstance) => instance.archNo,
            width: 90
        },
        {
            title: "流程状态",
            render: (instance: HistoryProcesseInstance) => <StateTag state={instance.state ?? ''}></StateTag>,
            width: 100
        },
        {
            title: "开始时间",
            render: (instance: HistoryProcesseInstance) => instance.startTime?.toLocaleDateString(),
            width: 100
        },
    ];

    return (<MainLayout>
        {/*  <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item><Link to="/">主页</Link></Breadcrumb.Item>
            <Breadcrumb.Item>公文监控</Breadcrumb.Item>
        </Breadcrumb> */}

        <div>
            <Form layout='inline'>
                <Form.Item label="年份">
                    <Select value={year} style={{ width: 200 }} onChange={(e) => setYear(e)}>
                        {years.map((item) => {
                            return <Option value={item} key={item}>{item}</Option>
                        })}
                    </Select>
                </Form.Item>
                <Form.Item label="流程选择">
                    <Select value={proDefKey} style={{ width: 200 }} onChange={(e) => setProDefKey(e)}>
                        {processDefKeys.map((item) => {
                            return <Option value={item.key} key={item.key}>{item.name}</Option>
                        })}
                    </Select>
                </Form.Item>

                <Form.Item label="标题查询">
                    <Search onSearch={e => setSearch(e.trim())} enterButton allowClear />
                </Form.Item>

                <Form.Item label="拟稿人查询">
                    <Search onSearch={e => drafterName.setValue(e.trim())} enterButton allowClear />
                </Form.Item>

                <Form.Item>
                    <Checkbox checked={onlyShowFinishedFlows.value} onChange={e => onlyShowFinishedFlows.Toggle()}>已完成的流程</Checkbox>
                </Form.Item>

                <Form.Item>
                    <Checkbox checked={onlyShowMeDrafter.value} onChange={e => onlyShowMeDrafter.Toggle()}>我起草的公文</Checkbox>
                </Form.Item>
            </Form>
        </div>

        <Table
            columns={columns}
            rowKey={(record: HistoryProcesseInstance) => record.id ?? ""}
            dataSource={archs.value?.rows}
            pagination={{ total: archs.value?.total, pageSize: pageSize }}
            loading={archs.loading}
            onChange={handleTableChange}
        />
    </MainLayout>
    )
}





export default ArchMonitorOld