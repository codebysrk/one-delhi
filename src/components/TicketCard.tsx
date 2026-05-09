import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ticket, TicketStatus, getRemainingValidity, isTicketExpired, getRouteNumberOnly, formatTimeTo12hr } from '../utils/ticketHelper';
import { InvalidStamp } from './InvalidStamp';

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
  showTimer?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onPress, showTimer }) => {
  const expired = isTicketExpired(ticket.timestamp);
  const isInvalid = ticket.status === TicketStatus.INVALID;
  const isCancelled = ticket.status === TicketStatus.CANCELLED;
  
  const showStamp = expired || isInvalid || isCancelled;
  const stampColor = isInvalid || isCancelled ? '#D32F2F' : '#616161';

  const getFormattedActiveDateTime = () => {
    const d = new Date(ticket.timestamp);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
  };

  const displayDateTime = !showStamp ? getFormattedActiveDateTime() : `${ticket.date} | ${formatTimeTo12hr(ticket.time)}`;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={1}
    >
      <View style={styles.topBorder} />
      <View style={styles.headerStrip} />
      
      <View style={styles.body}>
        <View style={styles.dataRow}>
          <Text style={styles.mainText}>{getRouteNumberOnly(ticket.route || ticket.id || 'Bus')}</Text>
          <Text style={styles.mainText}>₹{(Number(ticket.qty || 1) * Number(ticket.baseFare || 10)).toFixed(1)}</Text>
        </View>
 
        <View style={styles.dataRow}>
          <Text style={styles.mainText}>{displayDateTime}</Text>
          <Text style={styles.mainText}>x {ticket.qty || 1}</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.mainText} numberOfLines={1}>{ticket.source || ticket.src || ticket.from || 'Boarding'}</Text>
          <Text style={styles.mainText}>₹{Number(ticket.total || ticket.fare || 0).toFixed(1)}</Text>
        </View>

        <View style={styles.destRow}>
          <Text style={styles.mainText} numberOfLines={2}>{ticket.dest || ticket.dst || ticket.to || 'Destination'}</Text>
        </View>

        <View style={styles.tidContainer}>
          <Text style={styles.tidText}>{ticket.tid || ticket.id || 'T0000000000'}</Text>
        </View>

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
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: 'white', 
    borderRadius: 4, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#E0E0E0',
    width: '100%',
    marginVertical: 4
  },
  topBorder: { height: 1, backgroundColor: '#CCC' },
  headerStrip: { height: 16, backgroundColor: '#757575', marginTop: 8 },
  
  body: { 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    position: 'relative' 
  },
  dataRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 6 
  },
  destRow: {
    marginBottom: 6
  },
  mainText: { 
    fontSize: 16, 
    color: '#000', 
    fontWeight: '400',
    letterSpacing: -0.2
  },
  
  tidContainer: {
    alignItems: 'center',
    marginTop: 8
  },
  tidText: { 
    fontSize: 14, 
    color: '#444', 
    fontWeight: '400',
    letterSpacing: 0.2
  },

  timerMini: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center'
  },
  timerText: { fontSize: 12, color: '#D32F2F', fontWeight: '600' },
});
