import { computed, Signal, WritableSignal } from "@angular/core";
import { createComputed } from "@angular/core/primitives/signals";

declare const ngDevMode: boolean;

export interface WritableSignalLike<T> extends Signal<T> {
	set: WritableSignal<T>['set'];
	update: WritableSignal<T>['update'];
	asReadonly: WritableSignal<T>['asReadonly'];
}

declare const ɵCONVERTED_SIGNAL: unique symbol;

export interface ConvertedSignal<T> extends WritableSignalLike<T> {
	[ɵCONVERTED_SIGNAL]: T;
}

export function convertedSignal<T, R>(base: WritableSignalLike<T>, toResult: (v: T) => R, fromResult: (v: R) => T): ConvertedSignal<R>
{
	const result = <ConvertedSignal<R>>createComputed(() => toResult(base()));

	result.set = (newValue: R) => base.set(fromResult(newValue));
	result.update = (updateFn: (value: R) => R) => base.update(value => fromResult(updateFn(toResult(value))))
	result.asReadonly = () => computed(() => result());

	if (ngDevMode)
		result.toString = () => `[Signal: ${result()}]`;

	return result;
}
