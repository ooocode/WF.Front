import { Breadcrumb, Card, DatePicker, Form, Radio, RadioChangeEvent, Space, Spin } from "antd"
import React, { createRef, useEffect, useRef, useState } from "react"
import { useAsync } from "react-use"
import MainLayout from "../../components/MainLayout"
import { axiosClient, fetchClient, useUser } from "../../hooks/useApi"
import { PersonalReportVM, ReportsClient } from "../../WorkFlowApi"
import * as echarts from 'echarts';
import { messageBox } from "../../messageBox"
import locale from 'antd/es/date-picker/locale/zh_CN';
import { workFlowBaseUrl } from "../../Commmon/consts"
import { async } from "rxjs"

const reportClient = new ReportsClient(workFlowBaseUrl, { fetch: fetchClient })

export default () => {
    const { userName, loading } = useUser()

    return <MainLayout>
        {/* <Breadcrumb>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>公文报表</Breadcrumb.Item>
        </Breadcrumb> */}

        <div>
            {loading === false && userName && <>
                <CardMyTodo userName={userName}></CardMyTodo><br />
                <MyDepartmentTodo userName={userName}></MyDepartmentTodo><br />
                <MyDone userName={userName}></MyDone>
            </>}
        </div>
    </MainLayout>
}


const CardMyTodo = ({ userName }: { userName: string }) => {
    const divPersonalRef = createRef<HTMLDivElement>()

    useAsync(async () => {
        if (divPersonalRef.current === null) {
            return
        }

        // 基于准备好的dom，初始化echarts实例
        var myChart = echarts.init(divPersonalRef.current);

        const res = await reportClient.getUserTodoReport(userName)
        // 绘制图表
        myChart.setOption({
            toolbox: {
                show: true,
                feature: {
                    saveAsImage: {
                        show: true,
                        excludeComponents: ['toolbox'],
                        pixelRatio: 2
                    }
                }
            },
            title: {
                text: '我的待办公文饼图统计',
                subtext: '只统计新流程平台，不包含旧的收发文',
                left: 'center'
            },
            tooltip: {
                trigger: 'item'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
            },
            series: [
                {
                    name: '待办公文',
                    type: 'pie',
                    radius: '50%',
                    data:
                        /* {value: 1048, name: '搜索引擎'},
                         {value: 735, name: '直接访问'},
                         {value: 580, name: '邮件营销'},
                         {value: 484, name: '联盟广告'},
                         {value: 300, name: '视频广告'}*/
                        res.todoCountItems?.map(e => {
                            return {
                                value: e.count,
                                name: e.processDefName
                            }
                        })
                    ,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    },
                    itemStyle: {
                        normal: {
                            label: {
                                show: true,
                                formatter: '{b}:{c}'//'{b} : {c} ({d}%)'
                            },
                            labelLine: { show: true }
                        }
                    }
                }
            ]
        })
    }, [divPersonalRef.current, userName])

    return <Card
        style={{ width: '100%', backgroundColor: '#F0F2F5' }}
        title="我的待办公文"
    //extra={<a href="#">More</a>}
    >
        <div ref={divPersonalRef} style={{ width: '70vw', height: 300 }}></div>
    </Card>
}


const MyDepartmentTodo = ({ userName }: { userName: string }) => {
    const divMyDepartmentRef = createRef<HTMLDivElement>()
    useAsync(async () => {
        if (divMyDepartmentRef.current === null) {
            return
        }

        // 基于准备好的dom，初始化echarts实例
        var myChart = echarts.init(divMyDepartmentRef.current);

        const res = await reportClient.getMydepartmenOthors(userName)
        // 绘制图表
        myChart.setOption({
            toolbox: {
                show: true,
                feature: {
                    saveAsImage: {
                        show: true,
                        excludeComponents: ['toolbox'],
                        pixelRatio: 2
                    }
                }
            },

            tooltip: {
                trigger: 'axis',
                axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                    type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                }
            },

            title: {
                text: '我部门内待办公文柱状图',
                subtext: '只统计新流程平台，不包含旧的收发文',
                left: 'center'
            },
            xAxis: {
                type: 'category',
                axisLabel: { interval: 0, rotate: 30 },
                data: res.map(e => e.userDisplayName) //['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
            },
            yAxis: {},
            series: [{
                name: '待办公文数量',
                type: 'bar',
                data: res.map(e => e.todoCount), //[5, 20, 36, 10, 10, 20]
                itemStyle: {
                    normal: {
                        label: {
                            show: true, //开启显示
                            position: 'top', //在上方显示
                            textStyle: { //数值样式
                                color: 'black',
                                fontSize: 16
                            }
                        }
                    }
                }
            }]



            /* xAxis: {
                 max: 'dataMax',
             },
             yAxis: {
                 type: 'category',
                 data: res.map(e => e.userDisplayName),
                 inverse: true,
                 animationDuration: 300,
                 animationDurationUpdate: 300,
                 //max: 2 // only the largest 3 bars will be displayed
             },
             series: [{
                 realtimeSort: true,
                 name: 'X',
                 type: 'bar',
                 data: res.map(e => e.todoCount),
                 label: {
                     show: true,
                     position: 'right',
                     valueAnimation: true
                 }
             }],
             legend: {
                 show: true
             },
             animationDuration: 0,
             animationDurationUpdate: 3000,
             animationEasing: 'linear',
             animationEasingUpdate: 'linear',
       
             title: {
                 text: '我部门内待办公文统计',
                 left: 'center'
             },*/
        });
    }, [divMyDepartmentRef.current])
    return <Card
        style={{ width: '100%', backgroundColor: '#F0F2F5' }}
        title="我部门的待办公文"
    //extra={<a href="#">More</a>}
    >
        <div ref={divMyDepartmentRef} style={{ width: '70vw', height: 300 }}></div>
    </Card>
}


const MyDone = ({ userName }: { userName: string }) => {
    const divDonePersonalRef = createRef<HTMLDivElement>()
    const myChartRef = useRef<echarts.ECharts>()
    const [vm, setVm] = useState<PersonalReportVM>()

    const loadData = async (myChart: echarts.ECharts, startDateTime: Date, endDateTime: Date) => {
        const res = await reportClient.getUserDoneReport(userName, startDateTime, endDateTime)
        setVm(res)
        // 绘制图表
        myChart.setOption({
            /*tooltip: {
                trigger: 'axis',
                position: function (pt) {
                    return [pt[0], '10%'];
                }
            },*/

            toolbox: {
                show: true,
                feature: {
                    saveAsImage: {
                        show: true,
                        excludeComponents: ['toolbox'],
                        pixelRatio: 2
                    }
                }
            },

            tooltip: {
                trigger: 'axis',
                axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                    type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                }
            },

            title: {
                text: '我的已办公文折线图',
                subtext: '只统计新流程平台，不包含旧的收发文',
                left: 'center'
            },

            xAxis: {
                type: 'category',
                data: res.doneCountItems?.map(e => e.dateTime)
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: res.doneCountItems?.map(e => e.count),
                type: 'line',
                name: '已办公文数量'
                /*itemStyle: {
                    normal: {
                        label: {
                            show: true, //开启显示
                            position: 'top', //在上方显示
                            textStyle: { //数值样式
                                color: 'black',
                                fontSize: 16
                            }
                        }
                    }
                }*/
            }]


            /* xAxis: {
                 max: 'dataMax',
             },
             yAxis: {
                 type: 'category',
                 data: res.map(e => e.userDisplayName),
                 inverse: true,
                 animationDuration: 300,
                 animationDurationUpdate: 300,
                 //max: 2 // only the largest 3 bars will be displayed
             },
             series: [{
                 realtimeSort: true,
                 name: 'X',
                 type: 'bar',
                 data: res.map(e => e.todoCount),
                 label: {
                     show: true,
                     position: 'right',
                     valueAnimation: true
                 }
             }],
             legend: {
                 show: true
             },
             animationDuration: 0,
             animationDurationUpdate: 3000,
             animationEasing: 'linear',
             animationEasingUpdate: 'linear',
       
             title: {
                 text: '我部门内待办公文统计',
                 left: 'center'
             },*/
        });
    }

    const [dateSelect, setDateSelect] = useState(0)
    const [startDateTime, setStartDateTime] = useState<string>('')
    const [endDateTime, setEndDateTime] = useState<string>('')

    useAsync(async () => {
        if (divDonePersonalRef.current !== null) {
            var myChart = echarts.init(divDonePersonalRef.current);
            myChartRef.current = myChart

            var year = new Date().getFullYear()
            var month = new Date().getMonth() + 1
            await loadData(myChart, new Date(`${year}/${month}/1`), new Date(`${year}/${month + 1}/1`))
        }
    }, [divDonePersonalRef.current])



    const ondateSelectChange = async (e: RadioChangeEvent) => {
        if (myChartRef.current) {
            var year = new Date().getFullYear()
            var month = new Date().getMonth() + 1
            if (e.target.value === 0) {
                //本月
                await loadData(myChartRef.current, new Date(`${year}/${month}/1`), new Date(`${year}/${month + 1}/1`))
            } else if (e.target.value === 1) {
                //上月
                await loadData(myChartRef.current, new Date(`${year}/${month - 1}/1`), new Date(`${year}/${month}/1`))
            } else if (e.target.value === 2) {
                //今年
                await loadData(myChartRef.current, new Date(`${year}/1/1`), new Date(`${year + 1}/1/1`))
            }

            setDateSelect(e.target.value)
        }
    }

    const onStartDateTimeChange = async (date: any, str: string) => {
        console.log(date)
        if (myChartRef.current) {
            var year = new Date().getFullYear()
            await loadData(myChartRef.current, new Date(date === null ? '1970/1/1' : str), new Date((endDateTime?.length ?? 0) === 0 ? `${year + 1}/1/1` : endDateTime))
        }

        setStartDateTime(str)
    }

    const onEndDateTimeChange = async (date: any, str: string) => {
        if (myChartRef.current) {
            var year = new Date().getFullYear()
            var start = (startDateTime?.length ?? 0) === 0 ? `${year - 1}/1/1` : startDateTime
            await loadData(myChartRef.current, new Date(start), new Date(date === null ? '1970/1/1' : str))
        }
        setEndDateTime(str)
    }

    return <Card
        style={{ width: '100%', backgroundColor: '#F0F2F5' }}
        title={`我的已办公文，总计[${vm?.doneCount}]`}
    //extra={<a href="#">More</a>}
    >
        <Space>
            <Form layout="inline">
                <Form.Item label="时间段">
                    <Radio.Group value={dateSelect} onChange={ondateSelectChange}>
                        <Radio value={0}>本月</Radio>
                        <Radio value={1}>上个月</Radio>
                        <Radio value={2}>今年</Radio>
                        <Radio value={3}>指定时间段</Radio>
                    </Radio.Group>

                    {dateSelect === 3 && <DatePicker placeholder="开始时间" locale={locale} onChange={onStartDateTimeChange} />}
                    {dateSelect === 3 && <DatePicker placeholder="结束时间" locale={locale} onChange={onEndDateTimeChange} />}
                </Form.Item>
            </Form>
        </Space>
        <div ref={divDonePersonalRef} style={{ width: '70vw', height: 300 }}></div>
    </Card>
}