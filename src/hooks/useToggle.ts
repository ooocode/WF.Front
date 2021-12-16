import { useRef, useState } from 'react';

export interface IuseToggleResult {
    value: boolean
    Toggle: () => void
}

export function useToggle(): IuseToggleResult {
    const [value, setValue] = useState<boolean>(false)
    const Toggle = () => {
        setValue(!value)
    }

    return {
        value, Toggle
    }
}


export const useRefToggle = () => {
    const value = useRef<boolean>(false)
    const Toggle = () => {
        value.current = (!value.current)
    }

    return {
        value: value.current
        , Toggle
    }
}

export interface IUseStateExResult<T> {
    value: T
    setValue: React.Dispatch<React.SetStateAction<T>>
}

export function useStateEx<T>(initValue: T): IUseStateExResult<T> {
    const [value, setValue] = useState<T>(initValue)
    return {
        value,
        setValue
    }
}