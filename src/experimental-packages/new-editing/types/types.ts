// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export type StatePair<S> = [S, StateSetter<S>];
export type StateSetter<S> = FunctionalSetter<S> & ValueSetter<S>;
export type FunctionalSetter<S> = (updater: (currentState: S) => S) => void;
export type ValueSetter<S> = (newState: S) => void;

export type Callback<T> = (newValue: T) => void;
export type VoidCallback = () => void;
export type AsyncVoidCallback = () => Promise<void>;
