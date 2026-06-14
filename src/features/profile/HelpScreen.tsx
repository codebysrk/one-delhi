import React, { useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from "../../components/layout/Screen";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { MainHeader } from "../../components/layout/Header";
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
export const HelpScreen = ({
  navigation
}: any) => {
  const {
    width
  } = useWindowDimensions();
  const scrollRef = React.useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [activeTab, setActiveTab] = useState<"FAQs" | "Complaints">("FAQs");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const faqs = [{
    category: "General",
    items: [{
      id: "0",
      title: "ETM Related issue",
      content: "Delhi Transport Department has mandated the use of ETM in DIMTS (Orange and Blue coloured) buses and is gradually introducing this facility in all buses of Delhi. In case you find any issue of ETM missing, or not being used in DIMTS buses currently, please raise an issue."
    }]
  }, {
    category: "Driver",
    items: [{
      id: "1",
      title: "Rash Driving",
      content: "Delhi Transport Department has mandated its drivers to drive smoothly within a limited speed, making it convenient for all Bus travellers. If found, not ok, raise a complaint mentioning the exact reason."
    }, {
      id: "2",
      title: "Not stopping the bus at stop",
      content: "All buses in their specific routes have been mandated to stop at all the bus stops for easy on-boarding and deboarding of passengers. If they didn't stop at the same, raise a complaint."
    }, {
      id: "3",
      title: "Driving the bus slow or fast",
      content: "All buses follow a schedule and ply accordingly as per the schedule from Start point to Destination. The traffic jams on the roads are unavoidable and they are bound to move slowly during the same while even on full empty roads, they have been mandated not to cross the specified speed limit."
    }, {
      id: "4",
      title: "Late arrival or departure of the Bus",
      content: "All buses follow a schedule and ply accordingly. In cases of traffic jams, and bad weather conditions, on a few occasions, this schedule may get disrupted. If you still find, that the bus arrived earlier than scheduled or departed late, the same can be raised."
    }, {
      id: "5",
      title: "Wrong route",
      content: "The routes of all buses are fixed. On very rare occasions of very High traffic jams, waterlogging during monsoon and similar situations, the buses are sometimes diverted to another route for the convenience and safety of all passengers. If you still find them not taking the published routes in usual conditions, you are requested to raise a complaint mentioning the exact part of the route diverted."
    }, {
      id: "6",
      title: "Driver not allowed Ladies/Sr. Citizens to board from the front gate",
      content: "For the convenience of Ladies and senior citizens, Delhi Transport has mandated all buses to allow them to board from the front gate. The drivers have been mandated to stop the bus till they can easily board. If you find a case where they have been denied boarding from the front gate, raise an issue."
    }, {
      id: "7",
      title: "Driver misbehave",
      content: "Any behavioural issue with passenger(s) will be taken very seriously and the same will be investigate with the on-ground team giving a fair time for the Driver to respond. Delhi Transport Department will take appropriate action accordingly."
    }]
  }, {
    category: "Conductor",
    items: [{
      id: "8",
      title: "The conductor refused to give a complaint book",
      content: "Any complaint can be registered in the complaint book, available with the conductor all the time. If the same is not provided by them, we suggest you to use this portal for lodging your complaint directly and faster response."
    }, {
      id: "9",
      title: "Conductor misbehave",
      content: "Any behavioural issue with passengers will be taken very seriously and the same will be investigate with the on-ground team giving a fair time for the conductor to respond. Delhi Transport Department will take appropriate action accordingly."
    }, {
      id: "10",
      title: "Conductor not issuing the ticket after taking fare",
      content: "Delhi Transport Department has mandated its conductors to issue tickets to all passengers. It also includes giving the pink ticket or ₹0 value ticket, if issued to women as they can travel for free. Pass holders have been exempted for the same.\n\nIf the ticket is not issued to you, please raise a complaint and necessary action will be taken against the bus conductor."
    }, {
      id: "11",
      title: "Excess fare charged",
      content: "The fares between Stop A and B are fixed and any bus conductor can't charge more or less than the same. If this happens, raise a complaint."
    }]
  }, {
    category: "Marshal",
    items: [{
      id: "12",
      title: "Marshal misbehave",
      content: "Any behavioural issue with passengers will be taken very seriously and the same will investigate with the on-ground team giving a fair time for the marshall to respond. Delhi Transport Department will take appropriate action accordingly."
    }, {
      id: "13",
      title: "Marshal was busy using phone",
      content: "All Marshals in the buses have been deputed for the safety and convenience of passengers. They have been mandated to strictly monitor things during the trip. They are allowed to use phones in case of emergency. In cases of any marshal being found continuously using a phone, the same is to be raised."
    }]
  }, {
    category: "Bus",
    items: [{
      id: "14",
      title: "Not displaying the destination board",
      content: "The destination board in all the buses is used for showing the next stop and makes it easier for passengers. The same needs to be functional at all times. If not, you can let us know."
    }, {
      id: "15",
      title: "Bus cleanliness",
      content: "All buses are cleaned on a daily basis to maintain good public hygiene. If you find not being followed, please report it. Your feedback will be important."
    }, {
      id: "16",
      title: "AC not working",
      content: "All AC buses are mandated to operate AC as per the weather conditions. The same needs to be properly functioning at all times for the convenience of travelers."
    }]
  }, {
    category: "Bus Queue",
    items: [{
      id: "17",
      title: "Damaged condition",
      content: "All Bus Queue Shelters (BQS) are expected to be in proper condition all the time. The seating, the Roof, the Floor and the advertisement panel are all included in the same. Any damaged BQS should be reported for necessary action."
    }, {
      id: "18",
      title: "Cleanliness issue",
      content: "All BQS is mandated to clean all the time for the convenience of passengers. If found not ok, the same can be reported for our necessary action."
    }]
  }, {
    category: "EV Charging",
    items: [{
      id: "19",
      title: "I know there is an EV charger near my home but it isn't available on the app",
      content: "Delhi Transport Department has provided an API which can be used by any EV charger (EVC) or Battery swapping station (BSS) partner for showing the same on One Delhi app. There may be few players which are not providing the required data to the Delhi govt. All those EVC and BSS may not be discoverable on the app currently. Those players are requested to reach out to us from the Contact us section."
    }, {
      id: "20",
      title: "Charging rates shown were different than those shown on the app",
      content: "It's our constant endeavour to provide the exact data as being provided by the Charge point operators (CPO). In very rare cases, if there is some technical glitch, the same may have happened. You are requested to raise a complaint in any such case for us to make our systems better."
    }, {
      id: "21",
      title: "Why am I not able to book a slot from One Delhi app",
      content: "Currently, the One Delhi app is aggregating all the EVC and BSS in Delhi and is only having the discoverability feature. This way you are able to discover all these in one place. We currently have more than 2000+ EVC and BSS. The booking of slots, payments and use of the same, for now, is to be done from the respective CPO app only.\n\nDelhi Transport Department is already in process of starting the booking and payments of EV charging sessions or Battery swap from the One Delhi app only; the same should be made available in the future."
    }]
  }, {
    category: "Online Ticket",
    items: [{
      id: "22",
      title: "I booked a ticket but didn't receive it",
      content: "Each ticket booked from the app comes with an order id and payment details. The transaction will be either a success or a failure. In both cases, an order id will be generated. In case payment is deducted but the transaction was a failure, the amount is automatically refunded from the bank side in 5-7 working days."
    }]
  }, {
    category: "Metro Ticket",
    items: [{
      id: "23",
      title: "When can I purchase a Metro Ticket on the app?",
      content: "Weekdays: 06:00 AM - 09:00 PM\nWeekends: 08:00 AM - 09:00 PM"
    }, {
      id: "24",
      title: "How do I get a refund for my QR ticket?",
      content: "• Didn't see your ticket within 5 minutes of payment? Rest easy. We'll automatically process your refund within 24 hours back to your original method of payment.\n• For other refund scenarios, simply visit the Complaint Section of this app within an hour of ticket purchase. Select the 'Metro Ticket' category and input your Order ID/Payment ID."
    }, {
      id: "25",
      title: "What should I know about my ticket?",
      content: "• Make sure to enter the AFC gate within 1 hour of ticket purchase.\n• Your ticket remains valid for up to 2 hours from purchase.\n• QR tickets are only valid for the business day they're purchased on.\n• Discounts aren't available for QR tickets."
    }, {
      id: "26",
      title: "What if my phone is unresponsive or lost at exit?",
      content: "• If you face issues like a dead battery, lost phone, or connectivity problems, contact our help desk. You'll be considered ticketless for the time being, but we'll provide a paid exit QR ticket to help you exit the station."
    }, {
      id: "27",
      title: "Exiting from the station you entered?",
      content: "• If you exceed the allowed time, you'll be charged a penalty of Rs 10/ per hour (max Rs 50/-).\n• For the Airport Express Line, the max travel time is 65 minutes for a single journey. If you surpass this, it's Rs 20/ per hour with a max penalty of Rs 400/-.\n• You can exit within 20 minutes of entry at regular stations (or 30 minutes at Airport Express Line) to avoid penalties.\n• On the Airport Express Line, refunds aren't permitted for single journey paper QR tickets. However, in special cases like service disruptions, partial refunds are possible."
    }, {
      id: "28",
      title: "Thinking of extending your journey?",
      content: "• Remember, digital tickets are valid only up to the specified destination."
    }, {
      id: "29",
      title: "Got another question?",
      content: "• Head over to the Complaint Section of the OneDelhi App and select the 'Metro Ticket' category. We're here to assist!"
    }]
  }];
  const faqData = useMemo(() => {
    let data: any[] = [];
    data.push({
      type: "sticky-title",
      title: "FAQs"
    });
    faqs.forEach(cat => {
      data.push({
        type: "header",
        title: cat.category
      });
      cat.items.forEach(item => {
        data.push({
          type: "item",
          ...item
        });
      });
    });
    return data;
  }, []);
  const complaintData = useMemo(() => {
    let data: any[] = [];
    data.push({
      type: "sticky-title",
      title: "My Complaints"
    });
    data.push({
      type: "complaints-empty"
    });
    return data;
  }, []);
  const handleTabPress = useCallback((tab: "FAQs" | "Complaints") => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({
      x: tab === "FAQs" ? 0 : width,
      animated: true
    });
  }, [width]);
  const handleScroll = useCallback((event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    scrollX.value = xOffset;
    if (xOffset >= width / 2 && activeTab !== "Complaints") {
      setActiveTab("Complaints");
    } else if (xOffset < width / 2 && activeTab !== "FAQs") {
      setActiveTab("FAQs");
    }
  }, [width, activeTab, scrollX]);
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: scrollX.value / width * (width / 2)
    }]
  }));
  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);
  const renderItem = useCallback(({
    item
  }: {
    item: any;
  }) => {
    if (item.type === "sticky-title") {
      return <View style={styles.stickyTitleWrapper}>
          <Text style={styles.pageTitle}>{item.title}</Text>
        </View>;
    }
    if (item.type === "header") {
      return <View style={styles.faqCategory}>
          <Text style={styles.categoryHeader}>{item.title}</Text>
        </View>;
    }
    if (item.type === "item") {
      const isExpanded = expandedId === item.id;
      return <View style={styles.faqRowItemWrapper}>
          <View style={styles.faqRowItem}>
            <TouchableOpacity style={styles.faqToggle} onPress={() => toggleExpand(item.id)} activeOpacity={0.6}>
              <Text style={styles.faqItemTitle}>{item.title}</Text>
              <View style={[styles.statusIndicator, isExpanded ? styles.minusStatus : styles.plusStatus]}>
                {isExpanded ? <MaterialCommunityIcons name="minus" size={14} color="white" /> : <MaterialCommunityIcons name="plus" size={14} color="white" />}
              </View>
            </TouchableOpacity>
            {isExpanded && <View style={styles.faqDetailBox}>
                <Text style={styles.faqDetailText}>{item.content}</Text>
              </View>}
          </View>
        </View>;
    }
    if (item.type === "complaints-empty") {
      return <View style={styles.noComplaintsBox}>
          <Text style={styles.noComplaintsText}>
            Please enter your email in settings to see your past raised
            complaints
          </Text>
        </View>;
    }
    return null;
  }, [expandedId, toggleExpand]);
  const insets = useSafeAreaInsets();
  return <Screen noPadding ignoreTopSafe style={styles.container}>
      <MainHeader style={styles.headerArea} showSearch={false} imageOpacity={0.9} rightElement={<TouchableOpacity onPress={() => (navigation as any).navigate("ProfileStack", {
      screen: "Settings"
    })}>
            <MaterialCommunityIcons name="cog" size={26} color="white" />
          </TouchableOpacity>} />

      <View style={styles.tabSection}>
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress("FAQs")} activeOpacity={1}>
          <Text style={[styles.tabLabel, activeTab === "FAQs" && styles.activeTabLabel]}>
            FAQs
          </Text>
        </TouchableOpacity>
        <View style={styles.tabDivider} />
        <TouchableOpacity style={styles.tabItem} onPress={() => handleTabPress("Complaints")} activeOpacity={1}>
          <Text style={[styles.tabLabel, activeTab === "Complaints" && styles.activeTabLabel]}>
            My Complaints
          </Text>
        </TouchableOpacity>
        <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
      </View>

      <View style={styles.mainWrapper}>
        <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleScroll} onScroll={handleScroll} scrollEventThrottle={16}>
          <View style={{
          width
        }}>
            <FlashList data={faqData} renderItem={renderItem} estimatedItemSize={60} stickyHeaderIndices={[0]} contentContainerStyle={{
            paddingBottom: insets.bottom + 120
          }} showsVerticalScrollIndicator={false} extraData={expandedId} />
          </View>
          <View style={{
          width
        }}>
            <FlashList data={complaintData} renderItem={renderItem} estimatedItemSize={60} stickyHeaderIndices={[0]} contentContainerStyle={{
            paddingBottom: insets.bottom + 120
          }} showsVerticalScrollIndicator={false} scrollEnabled={false} />
          </View>
        </ScrollView>

        <View style={[styles.stickyActionArea, {
        paddingBottom: insets.bottom + 15
      }]}>
          <Text style={styles.actionHint}>
            Can't find what you're looking for?
          </Text>
          <PrimaryButton title="Raise New Complaint" onPress={() => {}} activeOpacity={0.8} />
        </View>
      </View>
    </Screen>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  headerArea: {
    overflow: "hidden"
  },
  tabSection: {
    flexDirection: "row",
    height: 48,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB"
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },
  tabDivider: {
    width: 1,
    height: "50%",
    backgroundColor: "#F3F4F6",
    alignSelf: "center"
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    width: "50%",
    height: 2,
    backgroundColor: "#C0282C"
  },
  tabLabel: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "400"
  },
  activeTabLabel: {
    color: "#111827",
    fontWeight: "400"
  },
  mainWrapper: {
    flex: 1,
    position: "relative"
  },
  scrollPadding: {
    paddingBottom: 120
  },
  stickyTitleWrapper: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    zIndex: 10
  },
  faqBodyWrapper: {
    paddingHorizontal: 20,
    paddingTop: 15
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000000"
  },
  faqCategory: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 2
  },
  categoryHeader: {
    fontSize: 17,
    fontWeight: "800",
    color: "#C0282C"
  },
  faqRowItemWrapper: {
    paddingHorizontal: 20
  },
  faqRowItem: {
    marginBottom: 0
  },
  faqToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4
  },
  faqItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333ff",
    flex: 1,
    paddingRight: 16,
    lineHeight: 18
  },
  statusIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center"
  },
  plusStatus: {
    backgroundColor: "#4B5563"
  },
  minusStatus: {
    backgroundColor: "#C0282C"
  },
  faqDetailBox: {
    paddingTop: 2,
    paddingBottom: 10
  },
  faqDetailText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginTop: 0
  },
  noComplaintsBox: {
    paddingVertical: 180,
    justifyContent: "center",
    alignItems: "center"
  },
  noComplaintsText: {
    fontSize: 20,
    color: "#000000ff",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "500",
    marginTop: 50
  },
  stickyActionArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 15
  },
  actionHint: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
    textAlign: "center"
  },
  actionBtn: {
    width: "100%",
    backgroundColor: "#C0282C",
    height: 52,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center"
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500"
  }
});