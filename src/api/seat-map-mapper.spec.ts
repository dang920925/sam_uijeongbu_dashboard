import {
  formatReservationSeats,
  fromAdminSeatMapResponse,
  toSeatText,
} from '@/src/api/seat-map-mapper';

describe('fromAdminSeatMapResponse', () => {
  it('좌석 칸에 "A1" 이름과 위치를 붙이고 예매 정보를 옮긴다', () => {
    // Arrange · Act
    const map = fromAdminSeatMapResponse({
      seatSelectionEnabled: true,
      rowCount: 1,
      colCount: 2,
      total: 1,
      remaining: 0,
      rows: [
        {
          label: 'A',
          cells: [
            {
              seatId: 's1',
              kind: 'SEAT',
              rowLabel: 'A',
              seatNumber: 1,
              sold: true,
              reservationId: 'r1',
              bookerName: 'fixture-이름',
            },
            {
              seatId: null,
              kind: 'VOID',
              rowLabel: null,
              seatNumber: null,
              sold: false,
              reservationId: null,
              bookerName: null,
            },
          ],
        },
      ],
    });
    // Assert
    expect(map.rows[0].cells[0]).toMatchObject({
      key: 'r0c0',
      seatLabel: 'A1',
      sold: true,
      reservationId: 'r1',
    });
    expect(map.rows[0].cells[1]).toMatchObject({ kind: 'VOID', colIndex: 1 });
  });
});

describe('formatReservationSeats · toSeatText', () => {
  it('열·번호 순 "B3·B4", 없으면 좌석 지정 공연만 "좌석 미정"', () => {
    const seats = [
      { rowLabel: 'B', seatNumber: 4 },
      { rowLabel: 'B', seatNumber: 3 },
    ];
    expect(formatReservationSeats(seats)).toBe('B3·B4');
    expect(toSeatText(seats, false, '좌석 미정')).toBe('B3·B4');
    expect(toSeatText([], true, '좌석 미정')).toBe('좌석 미정');
    expect(toSeatText([], false, '좌석 미정')).toBeNull();
    expect(toSeatText([], null, '좌석 미정')).toBeNull();
  });
});
