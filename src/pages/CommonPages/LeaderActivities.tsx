
import { Form, Input, Select } from 'antd';
import * as React from 'react';
import { useAsyncRetry } from 'react-use';
import { workFlowBaseUrl } from '../../Commmon/consts';
import MainLayout from '../../components/MainLayout';
import { fetchClient } from '../../hooks/useApi';
import { LeaderActivitiesClient } from '../../WorkFlowApi';

const LeaderActivities = () => {
    const groups = useAsyncRetry(async () => {
        const client = new LeaderActivitiesClient(workFlowBaseUrl, { fetch: fetchClient })
        const res = await client.getList(new Date('2021/11/15'), new Date('2021/11/21'), undefined)
        return res
    }, [])

    const [select, setSelect] = React.useState(1)
    return <MainLayout>
        <div>
            <table className="table table-bordered" style={{ fontSize: 14 }}>
                <thead style={{textAlign:"center"}}>
                    <tr>
                        <th style={{ width: 150 }}>日期</th>
                        <th style={{ width: 210 }}>时间</th>
                        <th>内容</th>
                        <th>地点</th>
                        <th>参会人员</th>
                        <th style={{width:90}}>车辆安排</th>
                    </tr>
                </thead>

                <tbody>
                    {groups.value?.value?.map(group => {
                        return <React.Fragment key={group.dateTime}>
                            <tr>
                                <td rowSpan={group.items?.length}>{group.dateTime}</td>
                                <>
                                    <td>{group.items?.at(0)?.customDateTime}</td>
                                    <td>{group.items?.at(0)?.content}</td>
                                    <td>{group.items?.at(0)?.address}</td>
                                    <td>{group.items?.at(0)?.persons}</td>
                                    <td>{group.items?.at(0)?.remark}</td>
                                </>
                            </tr>

                            {group.items?.slice(1).map(item => {
                                return <tr key={item.id}>
                                    <td>{item.customDateTime}</td>
                                    <td>{item.content}</td>
                                    <td>{item.address}</td>
                                    <td>{item.persons}</td>
                                    <td>{item.remark}</td>
                                </tr>
                            })}
                        </React.Fragment>
                    })}
                </tbody>
            </table>
        </div>
    </MainLayout>
}

export default LeaderActivities