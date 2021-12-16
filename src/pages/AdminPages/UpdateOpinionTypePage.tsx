import { Button, Checkbox, Form, Input, Space } from 'antd';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import TextArea from 'antd/lib/input/TextArea';
import React, { useEffect, useRef, useState } from 'react';
import { InputGroup } from '../../components/InputGroup';
import MainLayout from '../../components/MainLayout';
import { opinionTypesClient, processDefsClient } from '../../hooks/useApi';
import { useQueryStringParser } from '../../hooks/useQueryStringParser';
import { messageBox } from '../../messageBox';
import { IOpinionTypeViewModel, ProcessDefViewModel, OpinionTypeViewModel } from '../../WorkFlowApi';

const UpdateOpinionTypePage = () => {
    const query = useQueryStringParser()
    const id = query.get('id')
    const [vm, setVm] = useState<IOpinionTypeViewModel>()
    const [prodef, setProdef] = useState<ProcessDefViewModel>()
    const arrAllowEditOnActvities = useRef<string[]>([])
    const arrOpinionButtons = useRef<string[]>([])

    useEffect(() => {
        opinionTypesClient.getOpinionTypeById(parseInt(id ?? '')).then(res => {
            setVm(res)
            arrAllowEditOnActvities.current = res.arrAllowEditOnActvities ?? []
            processDefsClient.getProcessDefByKey(res.processDefKey).then(prodef => {
                setProdef(prodef)
            }).catch(err => messageBox(err))

        }).catch(err => messageBox(err))
    }, [id])


    /**
     * 点击保存
     */
    const onSaveClicked = () => {
        var model = OpinionTypeViewModel.fromJS(vm)
        model.arrAllowEditOnActvities = arrAllowEditOnActvities.current
        model.arrOpinionButtons = arrOpinionButtons.current

        opinionTypesClient.updateOpnionType(parseInt(id?.toString() ?? ''), model).then(() => {
            messageBox('修改成功')
        }).catch(err => messageBox(err))
    }

    const onCancelBtnClicked = () => {
        window.history.back()
    }

    function onCheckboxGroupChange(checkedValues: CheckboxValueType[]) {
        arrAllowEditOnActvities.current = checkedValues.map(e => { return e.toString() })
    }

    return (vm !== undefined) ? <MainLayout>
        <Form labelCol={{ span: 4 }}>
            <Form.Item label='处理定义key' required>
                <Input defaultValue={vm.processDefKey} onChange={e => setVm({ ...vm, processDefKey: e.target.value })} />
            </Form.Item>

            <Form.Item label='名称' required>
                <Input defaultValue={vm.name} onChange={e => setVm({ ...vm, name: e.target.value })} />
            </Form.Item>

            <Form.Item label='显示名称'>
                <Input defaultValue={vm.displayName} onChange={e => setVm({ ...vm, displayName: e.target.value })} />
            </Form.Item>

            <Form.Item label='描述'>
                <TextArea defaultValue={vm.desc} onChange={e => setVm({ ...vm, desc: e.target.value })} autoSize />
            </Form.Item>

            <Form.Item label='排序'>
                <Input defaultValue={vm.order} type='number' onChange={e => setVm({ ...vm, order: parseInt(e.target.value) })} />
            </Form.Item>

            <Form.Item label='默认意见按钮'>
                <InputGroup initValue={vm.arrOpinionButtons ?? []} onChange={(value) => arrOpinionButtons.current = value} />
            </Form.Item>


            <Form.Item label='允许填意见的活动'>
                <Checkbox.Group options={prodef?.userTaskActvities?.map(e => { return { label: e.value ?? '', value: e.value ?? '' } }) ?? []}
                    defaultValue={vm.arrAllowEditOnActvities}
                    onChange={(values: CheckboxValueType[]) => onCheckboxGroupChange(values)} />
            </Form.Item>

            <Form.Item label='操作'>
                <Space size='middle'>
                    <Button onClick={() => onSaveClicked()} type='primary'>确定</Button>
                    <Button onClick={() => onCancelBtnClicked()}>取消</Button>
                </Space>
            </Form.Item>
        </Form >
    </MainLayout > : <MainLayout>加载中.....</MainLayout>
}


export default UpdateOpinionTypePage