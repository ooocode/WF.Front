import React, { useEffect } from 'react';
import { navigate, withPrefix } from 'gatsby'
import { Layout, Menu, Button, Space, Row, Col, message, Badge } from 'antd';
import { UserOutlined, LaptopOutlined, NotificationOutlined, EditOutlined, FileSearchOutlined, MonitorOutlined, MailOutlined, StarFilled, FieldTimeOutlined, UserSwitchOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useStateEx } from '../hooks/useToggle';
import { fetchClient, inboxClient, tasksClient, usersClient, useUser } from '../hooks/useApi';
import { messageBox } from '../messageBox';
import { Image } from 'antd';

import "antd/dist/antd.css";
import './style.css'

import { idleAutoFlushMs, isDevelopment, isSSR, leftMenu_BGSSW_Banjian_url, leftMenu_BGSSW_url, leftMenu_BGSSW_Yuejian_url, leftMenu_FaWen_Url, leftMenu_GWSXSP_url, leftMenu_ShiWu_url, mainLayoutEnableReflush, mainLayoutLoadCountIntervalMS, showLogo, showMainLayout, title, workFlowBaseUrl } from '../Commmon/consts';
import { useAsync, useIdle, useInterval, useToggle, useWindowSize } from 'react-use';
import { EmailsClient, UnReadCountViewModel } from '../WorkFlowApi';


const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

const emailsClient = new EmailsClient(workFlowBaseUrl, { fetch: fetchClient })

const MainLayout1 = ({ children }: { children: React.ReactNode }) => {
    const openKeys = useStateEx<string[]>(['sub1', 'sub1-1'])

    const { userName, password, userDisplayName, removeLoginInfo, mainDepartment } = useUser()
    const [reloadCount, setReloadCount] = useToggle(false)

    const unReadEmailCount = useAsync(async () => {
        if (userName && password) {
            let vm = new UnReadCountViewModel()
            vm.userName = userName
            vm.password = password
            return await emailsClient.queryUnReadCount(vm)
        }
    }, [userName, password, reloadCount])

    const swBanjianCount = useAsync(async () => {
        if (userName) {
            return await tasksClient.queryTodoTaskListCount(userName, false, '', '办件', ['BGSSW'])
        }
    }, [userName, reloadCount])

    const swYuejianCount = useAsync(async () => {
        if (userName) {
            return await tasksClient.queryTodoTaskListCount(userName, false, '', '阅件', ['BGSSW'])
        }
    }, [userName, reloadCount])


    const fwCount = useAsync(async () => {
        if (userName) {
            return await tasksClient.queryTodoTaskListCount(userName, false, '', '', ['FWGL'])
        }
    }, [userName, reloadCount])

    const gwsxspCount = useAsync(async () => {
        if (userName) {
            return await tasksClient.queryTodoTaskListCount(userName, false, '', '', ['GWSXSP'])
        }
    }, [userName, reloadCount])

    const othersCount = useAsync(async () => {
        if (userName) {
            return await tasksClient.queryTodoTaskListCount(userName, false, '', '', ['CCSP', 'QJGL', 'QJGL_GXJ'])
        }
    }, [userName, reloadCount])

    const inboxUnAssigneedCount = useAsync(async () => {
        if (userName) {
            return await await inboxClient.getUnAssigneeCount()
        }
    }, [userName, reloadCount])

    useInterval(() => {
        if (mainLayoutEnableReflush) {
            setReloadCount()
        }
    }, mainLayoutLoadCountIntervalMS)


    const isLeader = useAsync(async () => {
        if (userName) {
            const res = await usersClient.getUserByUserName(userName)
            return res.isLeader === true
        }
    }, [userName])

    const onOpenChange = (keys: React.Key[]) => {
        console.log(keys)
        if (keys.length === 0) {
            openKeys.setValue([])
        } else {
            let newKeys = [keys[keys.length - 1].toString()]
            //if (keys.indexOf('sub1-1') !== -1) {
            newKeys.push('sub1-1')
            // }

            openKeys.setValue(newKeys);
        }
    }

    const btnLogoutClicked = async () => {
        await removeLoginInfo()
        await navigate('/AccountPages/Login')
    }

    const { width, height } = useWindowSize()

    const date = new Date()
    const weeks = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六");


    return <div style={{ overflowX: 'hidden' }}>
        {showMainLayout === false ? <> {children}</> : <Layout>
            <Header className="header" style={{
                background: '#002E8A',
                color: 'white',
                //overflow: 'auto',
                //height: '60px',
                //position: 'fixed',
                width: '100vw',
                left: 0,
            }} >
                <div className="logo">
                    <Row>
                        <Col span={16} onClick={() => window.location.href = withPrefix("/ArchPages/Index")}>
                            <Space>
                                {showLogo && <img style={{ width: 48, marginBottom: 15 }} src={withPrefix("/images/logo.png")} />}
                                <p style={{ fontSize: 20 }}>{title}</p>
                            </Space>
                        </Col>
                        <Col span={8}>
                            <p style={{ fontSize: 16, marginRight: 0, textAlign: "right" }}>
                                {width > 1400 && <span>今天是{date.getFullYear()}年{date.getMonth() + 1}月{date.getDate()}日 {weeks[date.getDay()]}  </span>}
                                {userDisplayName}&nbsp;&nbsp;
                                <Button onClick={btnLogoutClicked} size='small'>注销</Button>
                            </p>
                        </Col>
                    </Row>
                </div>
            </Header>
            <Layout style={{ marginTop: 1 }}>
                <Sider width={250} className="site-layout-background" style={{
                    // overflow: 'auto',
                    //height: '100vh',
                    //position: 'fixed',
                    //left: 0,
                    //top: 61
                }}>
                    <Menu
                        mode="inline"
                        //selectedKeys={selectKey.value}
                        //onSelect={e => { selectKey.setValue(e.selectedKeys?.map(e => e.toString()) ?? []); console.log(e) }}
                        //openKeys={openKeys.value}
                        //onOpenChange={onOpenChange}
                        defaultOpenKeys={openKeys.value}
                        style={{ height: '100%', borderRight: 0 }}
                    >
                        <SubMenu key="sub1" icon={<UserOutlined />} title="公文管理"
                            style={{ background: '#002E8A', color: 'white' }}
                        >
                            <SubMenu title="待办收文" key="sub1-1" icon={<MailOutlined />} onTitleClick={() => navigate(leftMenu_BGSSW_url + '&t=' + new Date().getMilliseconds())}>
                                <Menu.Item key="sub-1-1"
                                    onClick={() => navigate(leftMenu_BGSSW_Banjian_url + '&t=' + new Date().getMilliseconds())}>
                                    办件<span style={{ color: 'red' }}>({swBanjianCount.value})</span>
                                </Menu.Item>
                                <Menu.Item key="sub-1-2"
                                    onClick={() => navigate(leftMenu_BGSSW_Yuejian_url + '&t=' + new Date().getMilliseconds())}>
                                    阅件<span style={{ color: 'red' }}>({swYuejianCount.value})</span>
                                </Menu.Item>
                            </SubMenu>

                            <Menu.Item key="sub1-2" icon={<MailOutlined />} onClick={() => navigate(leftMenu_FaWen_Url + '&t=' + new Date().getMilliseconds())}>
                                待办发文<span style={{ color: 'red' }}>({fwCount.value})</span>
                            </Menu.Item>

                            <Menu.Item key="sub1-3" icon={<MailOutlined />} onClick={() => navigate(leftMenu_GWSXSP_url + '&t=' + new Date().getMilliseconds())}>
                                事项审批
                                <span style={{ color: 'red' }}>({gwsxspCount.value})</span>
                            </Menu.Item>

                            <Menu.Item key="sub1-4" icon={<MailOutlined />} onClick={() => navigate(leftMenu_ShiWu_url + '&t=' + new Date().getMilliseconds())}>
                                待办事务
                                <span style={{ color: 'red' }}>({othersCount.value})</span>
                            </Menu.Item>

                            {(userName === 'wuxj' || userName === 'liuhuan' || userName === 'lidongwen') && <Menu.Item key="sub1-6" icon={<MailOutlined />} onClick={() => navigate('/ArchPages/Inbox' + '?t=' + new Date().getMilliseconds())}>
                                公文交换收件箱
                                <span style={{ color: 'red' }}>({inboxUnAssigneedCount.value})</span>
                            </Menu.Item>}


                            <Menu.Item key="sub1-7" icon={<MailOutlined />} onClick={() => navigate('/ArchPages/ArchTodoCopySend')}>阅办</Menu.Item>
                            {/*  <Menu.Item key="sub1-6" icon={<MailOutlined />} onClick={() => navigate("/ArchPages/Inbox")}>收件箱<span style={{ color: 'red' }}>({inboxUnAssigneedCount.value})</span></Menu.Item> */}
                            <Menu.Item key="sub1-8" icon={<EditOutlined />} onClick={() => navigate(isDevelopment ? '/ArchPages/DraferArch' : '/ArchPages/DraferArchCustom')}>起草公文</Menu.Item>

                            <SubMenu title="已办查询" key="sub1-9" icon={<FileSearchOutlined />}>
                                <Menu.Item key="sub1-9-1"
                                    onClick={() => navigate('/ArchPages/ArchDone?processDefKey=BGSSW,IPM.WF.XBGSSW')}>
                                    收文
                                </Menu.Item>
                                <Menu.Item key="sub1-9-2"
                                    onClick={() => navigate('/ArchPages/ArchDone?processDefKey=FWGL,IPM.WF.XFWGL')}>
                                    发文
                                </Menu.Item>

                                <Menu.Item key="sub1-9-3"
                                    onClick={() => navigate('/ArchPages/ArchDone?processDefKey=GWSXSP,IPM.WF.GWSXSP')}>
                                    事项审批
                                </Menu.Item>
                                <Menu.Item key="sub1-9-4"
                                    onClick={() => navigate('/ArchPages/ArchDone?processDefKey=QJGL')}>
                                    请假
                                </Menu.Item>
                                <Menu.Item key="sub1-9-5"
                                    onClick={() => navigate('/ArchPages/ArchDone?processDefKey=CCSP')}>
                                    出差
                                </Menu.Item>
                            </SubMenu>
                            {/*                             <Menu.Item key="7" icon={<MonitorOutlined />} onClick={() => navigate('/ArchPages/ArchMonitorOld')}>公文监控</Menu.Item> */}
                            {/*   <Menu.Item key="sub1-9" icon={<MonitorOutlined />} onClick={() => navigate('/ArchPages/ArchMonitor')}>公文监控</Menu.Item>
 */}
                            <SubMenu title="公文监控" key="sub1-10" icon={<MonitorOutlined />}>
                                <Menu.Item key="sub1-10-1"
                                    onClick={() => navigate('/ArchPages/ArchMonitorFWGL?proDefKeys=FWGL,IPM.WF.XFWGL')}>
                                    发文
                                </Menu.Item>
                                <Menu.Item key="sub1-10-2"
                                    onClick={() => navigate('/ArchPages/ArchMonitorFWGL?proDefKeys=BGSSW,IPM.WF.XBGSSW')}>
                                    收文
                                </Menu.Item>
                                {(userName === 'lhl' || userName === 'john' || mainDepartment === '区市监局/办公室' || mainDepartment === '区市监局/局领导') && <Menu.Item key="sub1-10-3"
                                    onClick={() => navigate('/ArchPages/ArchMonitorFWGL?proDefKeys=GWSXSP,IPM.WF.GWSXSP')}>
                                    事项审批
                                </Menu.Item>}

                                {(userName === 'lhl' || userName === 'john' || mainDepartment === '区市监局/办公室' || mainDepartment === '区市监局/局领导' || mainDepartment === '区市监局/服务中心') && <Menu.Item key="sub1-10-4"
                                    onClick={() => navigate('/ReportPages/CCSPReport')}>
                                    出差申请
                                </Menu.Item>}
                            </SubMenu>


                            <Menu.Item key="sub1-11" icon={<FieldTimeOutlined />} onClick={() => navigate('/ArchPages/Report')}>公文统计图表</Menu.Item>

                            {userName === 'gexinjie' && <Menu.Item key="sub1-12" icon={<MonitorOutlined />} onClick={() => navigate('/ArchPages/AskForLeaveMonitor')}>集中公休假统计</Menu.Item>}

                            <Menu.Item key="sub1-13" icon={<UserSwitchOutlined />} onClick={() => navigate('/ArchPages/UserTaskDelegate')}>公文授权</Menu.Item>

                            <Menu.Item key="sub1-14" icon={<StarFilled />} onClick={() => navigate('/ArchPages/ArchMonitorStar')}>星标公文</Menu.Item>
                            <Menu.Item key="sub1-15" icon={<FileSearchOutlined />} onClick={() => navigate('/AdminPages/AttachmentsManagerPage')}>附件搜索</Menu.Item>
                        </SubMenu>

                        <SubMenu key="sub2" icon={<LaptopOutlined />} title="会议申请" style={{ background: '#002E8A', color: 'white' }}>
                            {/*  <Menu.Item key="5">option5</Menu.Item>
                        <Menu.Item key="6">option6</Menu.Item>
                        <Menu.Item key="7">option7</Menu.Item>
                        <Menu.Item key="8">option8</Menu.Item> */}
                            <Menu.Item key="8" onClick={() => window.open('http://172.26.130.105/OAIIIv3/default_hygl.aspx')}>会议申请</Menu.Item>
                        </SubMenu>

                        <SubMenu key="sub3" icon={<NotificationOutlined />} title="学习资料" style={{ background: '#002E8A', color: 'white' }}>
                            <Menu.Item key="9" onClick={() => window.open('http://172.26.130.105:5080/Forum/Index')}>学习资料</Menu.Item>
                            {/*   <Menu.Item key="10">option10</Menu.Item>
                        <Menu.Item key="11">option11</Menu.Item>
                        <Menu.Item key="12">option12</Menu.Item> */}
                        </SubMenu>

                        <SubMenu key="sub4" icon={<NotificationOutlined />} title="保密资料" style={{ background: '#002E8A', color: 'white' }}>
                            <Menu.Item key="10" onClick={() => window.open('http://172.26.130.105:5080/Forum/Index')}>保密资料</Menu.Item>
                            {/*   <Menu.Item key="10">option10</Menu.Item>
                        <Menu.Item key="11">option11</Menu.Item>
                        <Menu.Item key="12">option12</Menu.Item> */}
                        </SubMenu>

                        <SubMenu key="sub5" icon={<MenuUnfoldOutlined />} title="常用链接" style={{ background: '#002E8A', color: 'white' }}>
                            <Menu.Item key="11" onClick={() => window.open(`http://172.26.130.105:4096/Account/Login?userName=${userName}&password=${password}`)}>旧版OA</Menu.Item>
                            <Menu.Item key="12" onClick={() => window.open('http://172.26.130.105:4096/downloadApp.png')}>移动APP</Menu.Item>
                            <Menu.Item key="13" onClick={() => window.open('http://172.26.130.105/file/Firefox32.exe?t=1&FromOther=1')}>火狐浏览器</Menu.Item>
                            <Menu.Item key="14" onClick={() => window.open('http://172.26.130.105/file/wps2019.exe?t=1&FromOther=1')}>WPS2019</Menu.Item>
                        </SubMenu>


                        {userName === 'lhl' && <SubMenu key="sub6" icon={<NotificationOutlined />} title="管理员功能" style={{ background: '#002E8A', color: 'white' }}>
                            <Menu.Item key="6-0" onClick={() => window.open(workFlowBaseUrl + '/Spa/UserManager/userPages/')}>用户管理后台</Menu.Item>
                            <Menu.Item key="6-1" onClick={() => navigate('/AdminPages/OpinionsConfig')}>表单意见配置</Menu.Item>
                            <Menu.Item key="6-2" onClick={() => navigate('/AdminPages/ActivityUsersConfig')}>流程用户配置</Menu.Item>
                        </SubMenu>}

                        {/*  <SubMenu key="sub5" icon={<NotificationOutlined />} title="常用链接" style={{ background: '#002E8A', color: 'white' }}>
                            <Menu.Item key="11">option9</Menu.Item>
                        </SubMenu>

                        <SubMenu key="sub6" icon={<NotificationOutlined />} title="管理员功能" style={{ background: '#002E8A', color: 'white' }}>
                            <Menu.Item key="6-0" onClick={() => window.open(workFlowBaseUrl + '/Spa/UserManager/userPages/')}>用户管理后台</Menu.Item>
                            <Menu.Item key="6-1" onClick={() => navigate('/AdminPages/OpinionsConfig')}>表单意见配置</Menu.Item>
                            <Menu.Item key="6-2" onClick={() => navigate('/AdminPages/ActivityUsersConfig')}>流程用户配置</Menu.Item>
                        </SubMenu>

                        <SubMenu key="sub7" icon={<NotificationOutlined />} title="流程管理" style={{ background: '#002E8A', color: 'white' }}>
                            <Menu.Item key="7-1" onClick={() => navigate('/FlowManagerPages/FlowManagerPages/RuntimeFlowList')}>运行的流程</Menu.Item>
                            <Menu.Item key="7-2" onClick={() => navigate('/FlowManagerPages/FlowManagerPages/HistoryFlowList')}>历史的流程</Menu.Item>
                        </SubMenu>

                        <SubMenu key="sub8" icon={<NotificationOutlined />} title="未使用的" style={{ background: '#002E8A', color: 'white' }}>
                            <Menu.Item key="8-1" onClick={() => navigate("/UnusePages/AssetManagementPage")}>资产管理</Menu.Item>
                            <Menu.Item key="8-2" onClick={() => navigate("/UnusePages/BookManagementPage")}>图书管理</Menu.Item>
                            <Menu.Item key="8-3" onClick={() => navigate("/UnusePages/OfficeGoodsManagementPage")}>办公用品管理</Menu.Item>
                        </SubMenu> */}
                    </Menu>
                </Sider>
                <Layout>

                    {/*  <Breadcrumb style={{ margin: '16px 0' }}>
                        <Breadcrumb.Item>Home</Breadcrumb.Item>
                        <Breadcrumb.Item>List</Breadcrumb.Item>
                        <Breadcrumb.Item>App</Breadcrumb.Item>
                    </Breadcrumb> */}
                    <Content
                        className="site-layout-background"
                        style={{
                            padding: 10,
                            margin: 0,
                            minHeight: 280,
                        }}
                    >
                        <ul className="nav">
                            <li className="nav-item active p-0">
                                <a className="nav-link border-bottom border-primary" href={withPrefix("/ArchPages/Index")} style={{ color: 'black', fontSize: 18, backgroundColor: 'rgb(244,244,244)' }}><b>首页</b></a>
                            </li>

                            <li className="nav-item">
                                <a id="email" className="nav-link" href="http://172.26.130.105/webmail"
                                    target='_blank' style={{ color: 'black', fontSize: 18 }}>电子邮件{unReadEmailCount.error === undefined && (unReadEmailCount.value ?? 0) > 0 && <span style={{ color: 'red' }}>({unReadEmailCount.value})</span>}</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="http://172.26.130.105:4096/Contract"
                                    target='_blank' style={{ color: 'black', fontSize: 18 }}>通讯录</a>
                            </li>

                            {mainDepartment === '区市监局/办公室' && <li className="nav-item">
                                <a className="nav-link" href="http://172.26.130.105/oaiiiv3/SendMessage.aspx?FromOther=1"
                                    target='_blank' style={{ color: 'black', fontSize: 18 }}>短信功能</a>
                            </li>}

                            <li className="nav-item">
                                <a className="nav-link"
                                    href={`http://172.26.130.105:8080/Default.aspx?username=${userName}&name=${userDisplayName}`}
                                    target='_blank'
                                    style={{ color: 'black', fontSize: 18 }}>网络硬盘</a>
                            </li>


                            {(userName === 'lhl' || isLeader.value === true || userName === 'john' || userName === 'hej' || mainDepartment === '区市监局/局咨询小组办公室' || mainDepartment === '区市监局/办公室' || mainDepartment === '区市监局/局领导') && <li className="nav-item">
                                <a className="nav-link" href="http://172.26.130.105/oaiiiv3/SltLDZWhyhdListParent.aspx?FromOther=1"
                                    target="_blank" style={{ color: 'black', fontSize: 18 }}>领导活动</a>
                            </li>}


                            <li className="nav-item">
                                <a className="nav-link" href="http://130.20.128.3:8080/dbdc/web/login" target="_blank"
                                    style={{ color: 'black', fontSize: 18 }}>督查督办系统</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="http://172.26.130.221:9742/icm" target="_blank"
                                    style={{ color: 'black', fontSize: 18 }}>财务内控系统</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="http://10.6.11.154:8000/" target="_blank"
                                    style={{ color: 'black', fontSize: 18 }}>平时考核系统</a>
                            </li>
                        </ul>
                        <div style={{ marginTop: 10 }}>
                            <div style={{ height: height - 185, overflowY: 'auto', overflowX: "hidden" }}>
                                {children}
                            </div>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </Layout>}
    </div>
}


export default MainLayout1