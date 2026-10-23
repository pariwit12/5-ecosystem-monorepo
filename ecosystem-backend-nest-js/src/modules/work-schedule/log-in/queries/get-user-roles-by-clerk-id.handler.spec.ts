import { GetUserRolesByClerkIdHandler } from './get-user-roles-by-clerk-id.handler';
import { GetUserRolesByClerkIdQuery } from './get-user-roles-by-clerk-id.query';

describe('GetUserRolesByClerkIdHandler', () => {
  const prisma = {
    organizationWorkSchedulePlace: {
      findMany: jest.fn(),
    },
  };

  const accessControlService = {
    verifyPerson: jest.fn(),
  };

  const handler = new GetUserRolesByClerkIdHandler(
    prisma as never,
    accessControlService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters active places and staff/admin memberships based on session person', async () => {
    accessControlService.verifyPerson.mockResolvedValue({
      personId: 'person-1',
    });

    prisma.organizationWorkSchedulePlace.findMany
      .mockResolvedValueOnce([{ id: 'place-admin-1', name: 'Admin Place' }])
      .mockResolvedValueOnce([{ id: 'place-staff-1', name: 'Staff Place' }]);

    const result = await handler.execute(
      new GetUserRolesByClerkIdQuery('clerk-1'),
    );

    expect(accessControlService.verifyPerson).toHaveBeenCalledWith('clerk-1');
    expect(result).toEqual({
      placesAsAdmin: [{ id: 'place-admin-1', name: 'Admin Place' }],
      placesAsStaff: [{ id: 'place-staff-1', name: 'Staff Place' }],
    });
  });

  it('returns empty lists if user is neither admin nor staff', async () => {
    accessControlService.verifyPerson.mockResolvedValue({
      personId: 'person-2',
    });

    prisma.organizationWorkSchedulePlace.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await handler.execute(
      new GetUserRolesByClerkIdQuery('clerk-2'),
    );

    expect(result).toEqual({
      placesAsAdmin: [],
      placesAsStaff: [],
    });
  });
});
