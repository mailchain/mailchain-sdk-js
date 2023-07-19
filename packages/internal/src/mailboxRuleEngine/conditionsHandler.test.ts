import { mock } from 'jest-mock-extended';
import { AliceED25519PublicKey, BobED25519PublicKey } from '@mailchain/crypto/ed25519/test.const';
import { MessagePreview } from '../mailbox/types';
import { IdentityKeys } from '../identityKeys';
import {
	ConditionHandler,
	conditionIsFromAddressHandler,
	conditionOperationAndHandler,
	conditionOperationNotHandler,
	conditionOperationOrHandler,
	conditionsRunner,
	createConditionIsFromIdentityHandler,
} from './conditionsHandler';
import { RuleApplyParams } from './mailboxRuleEngine';
import {
	conditionIsFromAddress,
	conditionIsFromIdentity,
	conditionOperationAnd,
	conditionOperationNot,
	conditionOperationOr,
} from './conditions';

const mockParams: RuleApplyParams = { message: {} as MessagePreview };
describe('conditionsRunner', () => {
	it('should return true if any of the conditions in the list applies', async () => {
		const condition = { type: 'test-condition', value: 'test-value' };
		const handler1 = mock<ConditionHandler>();
		handler1.execute.mockResolvedValue(false);
		const handler2 = mock<ConditionHandler>();
		handler2.execute.mockResolvedValue(true);
		const handler3 = mock<ConditionHandler>();
		handler3.execute.mockResolvedValue(true);

		const result = await conditionsRunner(mockParams, condition, [handler1, handler2, handler3]);

		expect(result).toBe(true);
		expect(handler1.execute).toHaveBeenCalledWith(mockParams, condition, expect.any(Function));
		expect(handler2.execute).toHaveBeenCalledWith(mockParams, condition, expect.any(Function));
		expect(handler3.execute).not.toHaveBeenCalled();
	});
});

describe('conditionOperationOrHandler', () => {
	const orCondition = conditionOperationOr([
		{ type: 'test-condition-1', value: 'test-value-1' },
		{ type: 'test-condition-2', value: 'test-value-2' },
		{ type: 'test-condition-3', value: 'test-value-3' },
	]);

	it('should return false if none of the conditions in the list applies', async () => {
		const mockCheckCondition = jest.fn().mockResolvedValue(false);

		const result = await conditionOperationOrHandler.execute(mockParams, orCondition, mockCheckCondition);

		expect(result).toBe(false);
		expect(mockCheckCondition).toHaveBeenCalledWith(orCondition.value[0]);
		expect(mockCheckCondition).toHaveBeenCalledWith(orCondition.value[1]);
		expect(mockCheckCondition).toHaveBeenCalledWith(orCondition.value[2]);
	});

	it('should return true if any of the conditions in the list applies', async () => {
		const mockCheckCondition = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);

		const result = await conditionOperationOrHandler.execute(mockParams, orCondition, mockCheckCondition);

		expect(result).toBe(true);
		expect(mockCheckCondition).toHaveBeenCalledWith(orCondition.value[0]);
		expect(mockCheckCondition).toHaveBeenCalledWith(orCondition.value[1]);
		expect(mockCheckCondition).not.toHaveBeenCalledWith(orCondition.value[2]);
	});
});

describe('conditionOperationAndHandler', () => {
	const andCondition = conditionOperationAnd([
		{ type: 'test-condition-1', value: 'test-value-1' },
		{ type: 'test-condition-2', value: 'test-value-2' },
	]);

	it('should return false if any of the conditions in the list does not apply', async () => {
		const mockCheckCondition = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);

		const result = await conditionOperationAndHandler.execute(mockParams, andCondition, mockCheckCondition);

		expect(result).toBe(false);
		expect(mockCheckCondition).toHaveBeenCalledWith(andCondition.value[0]);
		expect(mockCheckCondition).toHaveBeenCalledWith(andCondition.value[1]);
	});

	it('should return true if all of the conditions in the list applies', async () => {
		const mockCheckCondition = jest.fn().mockResolvedValue(true);

		const result = await conditionOperationAndHandler.execute(mockParams, andCondition, mockCheckCondition);

		expect(result).toBe(true);
		expect(mockCheckCondition).toHaveBeenCalledWith(andCondition.value[0]);
		expect(mockCheckCondition).toHaveBeenCalledWith(andCondition.value[1]);
	});
});

describe('conditionOperationNotHandler', () => {
	const notCondition = conditionOperationNot({ type: 'test-condition', value: 'test-value' });

	it('should return false if the condition applies', async () => {
		const mockCheckCondition = jest.fn().mockResolvedValue(true);

		const result = await conditionOperationNotHandler.execute(mockParams, notCondition, mockCheckCondition);

		expect(result).toBe(false);
		expect(mockCheckCondition).toHaveBeenCalledWith(notCondition.value);
	});

	it('should return true if the condition does not apply', async () => {
		const mockCheckCondition = jest.fn().mockResolvedValue(false);

		const result = await conditionOperationNotHandler.execute(mockParams, notCondition, mockCheckCondition);

		expect(result).toBe(true);
		expect(mockCheckCondition).toHaveBeenCalledWith(notCondition.value);
	});
});

describe('conditionIsFromAddressHandler', () => {
	const condition = conditionIsFromAddress('test-address@mailchain.test');

	it('should return false if the message is not from the address', async () => {
		const mockParam2: RuleApplyParams = {
			...mockParams,
			message: { ...mockParams.message, from: 'other-random-address@mailchain.test' },
		};

		const result = await conditionIsFromAddressHandler.execute(mockParam2, condition, jest.fn());

		expect(result).toBe(false);
	});

	it('should return true if the message is from the address', async () => {
		const mockParam2: RuleApplyParams = {
			...mockParams,
			message: { ...mockParams.message, from: condition.value },
		};

		const result = await conditionIsFromAddressHandler.execute(mockParam2, condition, jest.fn());

		expect(result).toBe(true);
	});
});

describe('conditionIsFromIdentityHandler', () => {
	const condition = conditionIsFromIdentity(AliceED25519PublicKey);

	it('should return false if the message is not from the identity key', async () => {
		const mockIdentityKeys = mock<IdentityKeys>();
		mockIdentityKeys.resolve.mockResolvedValue({
			identityKey: BobED25519PublicKey,
			protocol: 'ethereum',
		});
		const conditionIsFromIdentityHandler = createConditionIsFromIdentityHandler(mockIdentityKeys);

		const result = await conditionIsFromIdentityHandler.execute(mockParams, condition, jest.fn());

		expect(result).toBe(false);
	});

	it('should return true if the message is from the identity key', async () => {
		const mockIdentityKeys = mock<IdentityKeys>();
		mockIdentityKeys.resolve.mockResolvedValue({
			identityKey: condition.value,
			protocol: 'ethereum',
		});
		const conditionIsFromIdentityHandler = createConditionIsFromIdentityHandler(mockIdentityKeys);

		const result = await conditionIsFromIdentityHandler.execute(mockParams, condition, jest.fn());

		expect(result).toBe(true);
	});
});
