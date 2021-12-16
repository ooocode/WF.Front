import { Button, Space, Table, Tag } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { Link } from 'gatsby';
import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/MainLayout';
import { opinionTypesClient, processDefsClient } from '../../hooks/useApi';
import { useQueryStringParser } from '../../hooks/useQueryStringParser';
import { useToggle } from '../../hooks/useToggle';
import { messageBox } from '../../messageBox';
import { ProcessDefViewModel, OpinionTypeViewModel } from '../../WorkFlowApi';

const OpinionsConfig = () => {
    const [types, setTypes] = useState<OpinionTypeViewModel[]>([])
    const [actReProcdefs, setActReProcdefs] = useState<ProcessDefViewModel[]>([])
    const query = useQueryStringParser()
    const prodefKey = query.get('prodefKey')
    const reloadTypeState = useToggle()

    useEffect(() => {
        opinionTypesClient.getOpinionTypes(prodefKey??'').then(res => {
            setTypes(res)
        }).catch(err => messageBox(err))
    }, [prodefKey, reloadTypeState.value])

    useEffect(() => {
        processDefsClient.getProcessDefs(false).then(res => {
            setActReProcdefs(res ?? [])
        }).catch(err => messageBox(err))
    }, [])

    const deleteTypeClicked = (vm: OpinionTypeViewModel) => {
        opinionTypesClient.delete(vm.id ?? 0).then(() => {
            messageBox('删除成功')
            reloadTypeState.Toggle()
        }).catch(err => messageBox(err))
    }


    const cols: ColumnsType<OpinionTypeViewModel> = [
        {
            title: '意见名称',
            render: (item: OpinionTypeViewModel) => <Link to={'/AdminPages/UpdateOpinionTypePage?id=' + item.id}>{item.name}</Link>
        },
        {
            title: '意见显示名称',
            render: (item: OpinionTypeViewModel) => item.displayName
        },
        {
            title: '哪些状态可以填意见',
            render: (item: OpinionTypeViewModel) => item.arrAllowEditOnActvities?.map(e => <Tag key={e}>{e}</Tag>)
        },
        {
            title: '操作',
            render: (item: OpinionTypeViewModel) => <Button onClick={() => deleteTypeClicked(item)} danger size='small'>删除</Button>
        }
    ]

    return <MainLayout>
        <div className="row">
            <div className="col-2">
                <nav className="nav flex-column">
                    {actReProcdefs.map(e => {
                        return <Link to={'?prodefKey=' + e.key} key={e.id}>
                            <span className={'nav-link' + (prodefKey === e.key ? ' bg-primary text-white' : '')}>{e.name}</span>
                        </Link>
                    })}
                </nav>
            </div>

            <div className="col-10">
                <Space size="middle">
                    <Link to={"/AdminPages/CreateOpinionTypePage?prodefKey=" + prodefKey}>创建类型</Link>
                </Space>
                <Table dataSource={types} columns={cols} rowKey={e => e.id ?? 0} />
            </div>
        </div>
    </MainLayout>
}

export default OpinionsConfig