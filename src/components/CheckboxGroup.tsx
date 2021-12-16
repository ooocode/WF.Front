import { Checkbox, Space } from 'antd';
import React from 'react';
export interface ICheckboxGroupProps {
    checkedValues: string[]
    allValues: string[]
    onChange: (value: string, checked: boolean) => void
}

export const CheckboxGroup = (props: ICheckboxGroupProps) => {
    return <div>
        <Space size='large'>
            {props.allValues.map(e => {
                return <Checkbox key={e} checked={props.checkedValues.findIndex(ee => ee == e) !== -1} onChange={(ee) => props.onChange(e, ee.target.checked)}>{e}</Checkbox>
            })}
        </Space>
    </div>
}