import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ticket, TicketStatus, getRemainingValidity, isTicketExpired, getRouteNumberOnly, formatTimeTo12hr } from '../../utils/ticketHelper';
import { InvalidStamp } from './InvalidStamp';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, RADII } from '../../core/theme';

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
  showTimer?: boolean;
  largeText?: boolean;
  showTID?: boolean;
  hideDivider?: boolean;
  compact?: boolean;
  use12hrFormat?: boolean;
  fullStampOpacity?: boolean;
}

export const TicketCard = React.memo(({ ticket, onPress, showTimer, largeText, showTID = true, hideDivider = false, compact = false, use12hrFormat = false, fullStampOpacity = false }: TicketCardProps) => {
  const expired = isTicketExpired(ticket.timestamp);
  const isInvalid = ticket.status === TicketStatus.INVALID;
  
  const showStamp = expired || isInvalid;
  const stampColor = COLORS.primary;

  const getFormattedActiveDateTime = () => {
    const ts = typeof ticket.timestamp === 'number' 
      ? ticket.timestamp 
      : (ticket.timestamp as any)?.toMillis?.() 
        || ((ticket.timestamp as any)?.seconds ? (ticket.timestamp as any).seconds * 1000 : ticket.timestamp);
      
    const d = new Date(ts);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    
    if (use12hrFormat) {
      return `${day}-${month}-${year} ${formatTimeTo12hr(`${hours}:${mins}`)}`;
    }
    return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
  };

  const displayDateTime = !showStamp ? getFormattedActiveDateTime() : `${ticket.date} | ${formatTimeTo12hr(ticket.time)}`;

  const textStyle = [styles.mainText, largeText && styles.largeMainText];
  const secondaryTextStyle = [styles.secondaryText, largeText && styles.largeSecondaryText];
  const locationTextStyle = [styles.locationText, largeText && styles.largeLocationText];
  const totalTextStyle = [styles.totalText, largeText && styles.largeTotalText];

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.headerStrip} />
      
      <View style={[styles.body, compact && { paddingBottom: 8 }]}>
        <View style={styles.dataRow}>
          <Text style={textStyle}>{getRouteNumberOnly(ticket.route || ticket.id || 'Bus')}</Text>
          <Text style={textStyle}>₹{(Number(ticket.qty || 1) * Number(ticket.baseFare || 10)).toFixed(1)}</Text>
        </View>
 
        <View style={styles.dataRow}>
          <Text style={secondaryTextStyle}>{displayDateTime}</Text>
          <Text style={secondaryTextStyle}>x {ticket.qty || 1}</Text>
        </View>
 
        <View style={styles.dataRow}>
          <Text style={locationTextStyle} numberOfLines={1}>{ticket.source || ticket.src || ticket.from || 'Boarding'}</Text>
          <Text style={totalTextStyle}>₹{Number(ticket.total || ticket.fare || 0).toFixed(1)}</Text>
        </View>
 
        <View style={styles.destRow}>
          <Text style={locationTextStyle} numberOfLines={2}>{ticket.dest || ticket.dst || ticket.to || 'Destination'}</Text>
        </View>

        {showTID && (
          <View style={[styles.tidContainer, hideDivider && { borderTopWidth: 0 }]}>
            <Text style={styles.tidText}>{ticket.tid || ticket.id || 'T0000000000'}</Text>
          </View>
        )}

        {showTimer && !expired && (
          <View style={styles.timerMini}>
            <Text style={styles.timerText}>
              Expires in: {getRemainingValidity(ticket.timestamp)}
            </Text>
          </View>
        )}

        {showStamp && (
          <InvalidStamp 
            text="INVALID" 
            color={stampColor}
            style={[styles.stampOverlay, fullStampOpacity && { opacity: 0.95 }, compact && { left: '26%', top: '42%' }]}
            size={compact ? 30 : 35}
            rotation={compact ? "-10deg" : "-12deg"}
          />
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: { 
    backgroundColor: COLORS.white, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: COLORS.border,
    width: '100%',
    ...SHADOWS.soft,
  },
  headerStrip: { 
    height: 16, 
    backgroundColor: '#757575', 
    marginTop: SPACING.sm 
  },
  body: { 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.lg, 
    position: 'relative' 
  },
  dataRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: SPACING.sm 
  },
  destRow: {
    marginBottom: SPACING.xs
  },
  mainText: { 
    ...TYPOGRAPHY.h4,
    color: COLORS.text, 
    fontWeight: '400',
  },
  largeMainText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '400',
  },
  secondaryText: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.text,
  },
  largeSecondaryText: {
    ...TYPOGRAPHY.h4,
    fontWeight: '400',
  },
  locationText: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.text,
    flex: 1,
  },
  largeLocationText: {
    ...TYPOGRAPHY.h4,
    fontWeight: '400',
  },
  totalText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '400',
  },
  largeTotalText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '400',
  },
  tidContainer: {
    alignItems: 'center',
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
  },
  tidText: { 
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  timerMini: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: RADII.sm,
    alignItems: 'center'
  },
  timerText: { 
    ...TYPOGRAPHY.bodySmall, 
    color: COLORS.primary, 
    fontWeight: '700' 
  },
  stampOverlay: {
    position: 'absolute',
    top: '35%',
    left: '25%',
    zIndex: 10,
    opacity: 0.8,
  }
});
