import React, { createContext } from 'react';

import { Link, navigate, withPrefix } from 'gatsby';
import MainLayout from '../../components/MainLayout';
import { useEffect } from 'react';
import { fetchClient, tasksClient, useUser } from '../../hooks/useApi';
import { IuseToggleResult, useStateEx, useToggle } from '../../hooks/useToggle';
import { ApiException, ErrorModel, MobileTaskList, MobileTaskListPaginationResult } from '../../WorkFlowApi';
import { messageBox } from '../../messageBox';
import { List, message, Tag } from 'antd';
import { lookTaskMode } from '../../Commmon/task';
import { useContext } from 'react';
import { idleAutoFlushMs, isSSR, leftMenu_BGSSW_Banjian_url, leftMenu_BGSSW_Yuejian_url, leftMenu_FaWen_Url, leftMenu_GWSXSP_url, leftMenu_ShiWu_url, showMainLayout, title } from '../../Commmon/consts';
import { useIdle, useInterval, useTitle } from 'react-use';
import { Typography, Switch } from 'antd';
import { Row, Col } from 'antd';
const { Paragraph, Text } = Typography;

interface ICardProps {
    title: string,
    taskList: MobileTaskListPaginationResult | undefined,
    color: string
    moreUrl: string
}

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



function Card(props: ICardProps) {
    const context = useContext(ReloadContext)

    const getOpenUrl = (task: MobileTaskList) => {
        let href: string
        if (task.processDefKey?.startsWith('IPM.') === true) {
            href = `http://172.26.130.105/OAIIIV3/FormOndo.aspx?FormClass=${task.processDefKey}&ID=${task.taskId?.split('-')[1]}&sView=1&FromOther=1`;
        } else {
            let mode: lookTaskMode = 'todo'
            href = `/FormPages/FlowForms/${task.processDefKey}?form=${task.processDefKey}&taskId=${task.taskId}&businessKey=${task.businessKey}&mode=${mode}`
            href = withPrefix(href)
        }

        let openWindow = window.open(href)
        let handler = setInterval(() => {
            if (openWindow?.closed) {
                setTimeout(() => {
                    context?.Toggle()
                    clearInterval(handler)
                }, 500);
            }
        }, 500)
    }


    return <div className="p-3  rounded shadow-sm mt-2" style={{ backgroundColor: 'rgb(248,249,250)' }}>
        <div className="row">
            <div className="col-8">
                <span onClick={() => navigate(props.moreUrl)}
                    className="pb-2 mb-0 text-left"
                    style={{ color: props.color, textDecoration: 'none', cursor: 'pointer', fontSize: 18 }}>
                    <b>{props.title}</b>
                </span>
            </div>


            <div className="col-4" style={{ textAlign: 'right' }}>
                <span onClick={() => navigate(props.moreUrl)} style={{ color: props.color, cursor: 'pointer' }}>更多</span>
            </div>
        </div>

        <div className="text-muted" style={{ borderTop: 'solid 1px black' }}>
            <List
                dataSource={props.taskList?.rows}
                locale={{ emptyText: <></> }}
                renderItem={e => (
                    <List.Item key={e.taskId}>
                        <List.Item.Meta
                            title={<Paragraph
                                ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
                                onClick={() => getOpenUrl(e)} style={{ cursor: 'pointer', color: '#007bFF', fontSize: 16 }}>
                                {getEmergencyLevel(e.emergencyLevel ?? '').length > 0 ? <span style={{ color: 'red' }}>[{getEmergencyLevel(e.emergencyLevel ?? '')}]</span> : <></>}
                                {e.title}
                            </Paragraph >}
                        />
                        <div>{e.createDateTime}</div>
                    </List.Item>
                )}
            />

            {/*  <div className='mt-2'>
                <table className="table">
                    <tbody>
                        {props.taskList?.rows?.map(e => {
                            return <tr key={e.taskId}>
                                <td style={{ width: '70%', border: 0 }}>
                                    <span onClick={() => getOpenUrl(e)} style={{ cursor: 'pointer', color: '#007bFF', fontSize: 16 }}>
                                        {getEmergencyLevel(e.emergencyLevel ?? '').length > 0 ? <span style={{ color: 'red' }}>[{getEmergencyLevel(e.emergencyLevel ?? '')}]</span> : <></>}
                                        {(e.title?.length ?? 0) > 35 ? (e.title?.substr(0, 35) + "...") : e.title}
                                    </span>
                                </td>
                                <td style={{ width: '30%', border: 0, textAlign: 'right' }}>{e.createDateTime}</td>
                            </tr>
                        })}
                    </tbody>
                </table>
            </div> */}
        </div>
    </div>
}

const ReloadContext = createContext<IuseToggleResult | undefined>(undefined)
export default function OutlinedCard() {
    const oldFW = useStateEx<MobileTaskListPaginationResult | undefined>(undefined)
    const oldSWBanjian = useStateEx<MobileTaskListPaginationResult | undefined>(undefined)
    const oldSWYuejian = useStateEx<MobileTaskListPaginationResult | undefined>(undefined)
    const gwsxsp = useStateEx<MobileTaskListPaginationResult | undefined>(undefined)
    const reload = useToggle()


    //待办事务
    const sw = useStateEx<MobileTaskListPaginationResult | undefined>(undefined)
    const take = 3


    useTitle(title)

    const { userName } = useUser()

    const loadArchs = async () => {
        if (userName) {
            tasksClient.queryTodoTaskList(userName, 0, take, false, '', '', ['FWGL']).then(res => {
                oldFW.setValue(res)
            }).catch(err => messageBox(err))

            tasksClient.queryTodoTaskList(userName, 0, take, false, '', '办件', ['BGSSW']).then(res => {
                oldSWBanjian.setValue(res)
            }).catch(err => messageBox(err))

            tasksClient.queryTodoTaskList(userName, 0, take, false, '', '阅件', ['BGSSW']).then(res => {
                oldSWYuejian.setValue(res)
            }).catch(err => messageBox(err))

            tasksClient.queryTodoTaskList(userName, 0, take, false, '', '', ['GWSXSP']).then(res => {
                gwsxsp.setValue(res)
            }).catch(err => messageBox(err))

            tasksClient.queryTodoTaskList(userName, 0, take, false, '', '', ['QJGL', 'CCSP']).then(res => {
                sw.setValue(res)
            }).catch(err => messageBox(err))
        }
    }

    useEffect(() => {
        loadArchs()
    }, [reload.value, userName])

    useInterval(() => {
        loadArchs()
    }, 5000)

    const isIdle = useIdle(idleAutoFlushMs);
    useEffect(() => {
        if (isIdle) {
            if (!isSSR) {
                message.info('长时间没有操作，自动刷新网页')
                window.location.reload()
            }
        }
    }, [isIdle])

    return <MainLayout>
        <ReloadContext.Provider value={reload}>
            <div>
                <Row>
                    <Col span={12} style={{ paddingRight: 8 }}>
                        <Card title='待办收文--办件' taskList={oldSWBanjian.value} color="rgb(234,67,53)" moreUrl={leftMenu_BGSSW_Banjian_url}></Card>
                    </Col>

                    <Col span={12} style={{ paddingRight: 8 }}>
                        <Card title='会议通知' taskList={undefined} color="rgb(230, 162, 60)" moreUrl={'#'}></Card>
                    </Col>

                    <Col span={12} style={{ paddingRight: 8 }}>
                        <Card title='事项审批' taskList={gwsxsp.value} color="rgb(0,0,0)" moreUrl={leftMenu_GWSXSP_url}></Card>
                    </Col>

                    <Col span={12} style={{ paddingRight: 8 }}>
                        <Card title='待办发文' taskList={oldFW.value} color="rgb(255,0,0)" moreUrl={leftMenu_FaWen_Url}></Card>
                    </Col>

                    <Col span={12} style={{ paddingRight: 8 }}>
                        <Card title='待办收文--阅件' taskList={oldSWYuejian.value} color="rgb(49, 126, 243)" moreUrl={leftMenu_BGSSW_Yuejian_url}></Card>
                    </Col>

                    <Col span={12} style={{ paddingRight: 8 }}>
                        <Card title='待办事务' taskList={sw.value} color="green" moreUrl={leftMenu_ShiWu_url}></Card>
                    </Col>
                </Row>
            </div>
        </ReloadContext.Provider>
    </MainLayout>
}