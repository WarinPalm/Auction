// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
import './Auction.sol';

// inheritant ถ่ายทอดจาก auction ไปยัง myAuction
contract MyAuction is Auction{
    ProductInfo public myProduct; // record เก็บข้อมูลสินค้าที่นำออกประมูล
    uint256 public auctionStarted; // เวลาเริ่มประมูล
    uint256 public auctionEnded; // เวลาจบสการประมูล | หน่วยเป็น วินาที
    AuctionState public STATE; // สถานะการประมูล
    address public highestBidder; //  | state variable สามารถเข้าถึงผ่านฟังก์ชั่นที่เข้าถึงตัวเองได้ทันที
    uint256 public highestBid; // ใช้เก็บข้อมูลการประมูลสูงสุด 
    address payable public owner; // address ไหนมีการรับเงินต้องใช้ payable เสมอ
    address [] public bidders; // เก็บข้อมูลมากกว่าหนึ่งจะตั้งชื่อเป็นพหูพจน๋
    mapping (address => uint256) bids; // คนนี้ประมูลเท่าไหร่ | ถ้า key ข้อมูลไม่มีจะ return 0 | key = address , value = uint | 1 row = 1 bidder ถ้าประมูลซ้ำข้อมูลจะถูกแทนที่ค่าเดิม

    // constructor จะถูกเรียกใช้เมื่อ deploy contract ขึ้นมา | constructor จะถูกเรียกใช้เพียงครั้งเดียว
    constructor(string memory _name , string memory _sn, uint durationMinute) {
        myProduct = ProductInfo(_name , _sn);
        auctionStarted = block.timestamp; // อยู่ในฟังก์ชันไหนคือเวลาที่ฟังก์ชันนั้นทำงาน
        auctionEnded = auctionStarted + durationMinute * 1 seconds; // 1 minutes ที่ smart contract มีให้
        owner = payable(msg.sender); // msg.sender คือคนเรียกใช้ฟังชั่นนี้ | ปัจจบันคนที่เรียกใช้คือเจ้าของ | payable(msg.sender) คือให้ msg.sender ให้ payable ก่อนถึงเอาไปใส่ให้ตัวแปรที่มีค่าเป็น payable ได้
        STATE = AuctionState.STARTED;
    }

    modifier onlyOwner { // ใช้ร่วมกับฟังก์ชัน
        require(msg.sender == owner , "Only can call this function"); // ข้อบังคับ
        _; // บอกว่าให้รันคำสั่งในฟังก์ชันซึ่ง modifier จะถูกใช้
    }
    modifier notOwner { // ใช้ร่วมกับฟังก์ชัน | ป้องกันความซ้ำซ้อนของการเรียกใช้ require
        require(msg.sender != owner , "Only can not call this function"); // ข้อบังคับ
        _; // บอกว่าให้รันคำสั่งในฟังก์ชันซึ่ง modifier จะถูกใช้
    }

    // func ที่มี virtual ต้องถูกแก้เป็น override เพื่อ impliment | ถ้าฟังชันถูก return มากกว่า 2 ค่าจะได้ค่า array
    function getProductInfo()  override public view returns (string memory , string memory) { 
        return (myProduct.Brand , myProduct.SerialNumber);
    }

    // ยื่นประมูล | การประมูลต้องมีการจ่ายเงินด้วย 
    function bid() external payable override notOwner { // owner ใช้ไม่ได้
        // 1.amount > highestBid | bidder != highestBidder 2.msg.sender != owner 3.update highestbid / highestBidder 4.store bid info on blockchain 4.1 first time 4.2 re bid 5.emit event
        // str จะถูกส่งเมื่อ condition = false | ถ้า require = false จะย้อนกลับทำฟังก์ชันใหม่ตั้งแต่ต้นอัตโนมัติ
        require(msg.value + bids[msg.sender] > highestBid , "Can not make a bid , please make a higher bid"); 
        // หากมีการใช้ require หลายๆครั้ง เราจะมีกลไลในเขียนให้ประหยัดเวลาด้วยทำ modifier โดยจะใช้ร่วมกับฟังก์ชัน
        require(msg.sender != highestBidder, "You are already a highest bidder");
        require(STATE == AuctionState.STARTED, "Can not make a bid"); // ต้องอยู่ในสถานะการประมูล
        highestBidder = msg.sender; // เก็บ address ของผู้ประมูลสูงสุด
        if(bids[msg.sender] == 0){   // first time
            bidders.push(msg.sender); // เก็บ addr ไว้ใน array
            bids[msg.sender] = msg.value;  // เก็บค่าการประมูลของผู้ประมูลคนนี้
        } else { // re bid
            bids[msg.sender] += msg.value; // ค่าที่ทบเงินใหม่จะถูกบวกเพิ่มเข้าไป
        }
        highestBid = bids[msg.sender]; // อัพเดทค่าลงไป
        emit BidEvent(msg.sender , highestBid, block.timestamp); // บันทึก event ลง contract เมื่อมีการประมูลเกิดขึ้น
    }

    // ฟังก์ชันที่ใช้สำหรับการเรียกดูข้อมูลการประมูลของผู้ใช้
    function getMyBid(address bidder) override external view returns (uint256) { 
        // sales |key|value1|value2| => sales[key] -->(value1,value2)
        // bids |key(address|value(uint| => bids[key(address)] -> value
        return bids[bidder]; // bid คือค่า key => addr มาจาก mapping
    }

    // 1 ฟังก์ชันจะใช้กี่ modifier ก็ได้ | ฟังก์ชันใดมีการเรียกใช้ modifier modifer จะถูกใช้งานก่อน
    // 1. STATE == START 2.bloack.timestamp >= auctionEnded 3. emit event
    function endAuction() external override onlyOwner{ 
        require(STATE == AuctionState.STARTED, "Can not end auction"); // ต้องอยู่ในสถานะการประมูล
        // เวลาที่ประมูลต้องหมดก่อนถึงจะสิ้นสุดได้
        require(block.timestamp >= auctionEnded, "Can not end before expiration time"); 
        STATE = AuctionState.ENDED; // เปลี่ยนสถานะการประมูลเป็น ended
        emit EndedEvent("Auction ended", block.timestamp); //  บันทึก event ลง contract เมื่อประมูลสิ้นสุดแล้ว

    }

    // ยกเลิกการประมูล
    function cancelAuction()  external override onlyOwner{ 
        require(STATE == AuctionState.STARTED, "Can not cancel the auction"); // ต้องอยู่ในสถานะการประมูล
        STATE = AuctionState.CANCELLED;
        emit CancelledEvent("Auction has been canceled", block.timestamp); //  บันทึก event ลง contract เมื่อประมูลถูกยกเลิกแล้ว
    }

    

    // ถอนเงินที่ประมูลไปแล้ว
    function withdraw()  external override {
        uint amount;
        if (msg.sender == highestBidder){ // highest bidder
            require(STATE == AuctionState.CANCELLED, "You not make a withdraw"); // ต้องอยู่ในสถานะการยกเลิกการประมูล
            amount = bids[msg.sender]; // ยอดเงินที่ประมูลไป
            delete bids[msg.sender]; // ป้องกันการถูกโจมตีแบบ | เคลียร์เงินเรียบร้อยแล้ว
        } else if (msg.sender == owner){ // owner
            require(STATE == AuctionState.ENDED, "Owner can not make a withdraw"); // ต้องอยู่ในสถานะการสิ้นสุดการประมูล
            amount = highestBid; // ยอดเงินประมูลสูงสุด
            delete bids[highestBidder]; // ป้องกันการถูกโจมตีแบบ | เคลียร์เงินเรียบร้อยแล้ว
            highestBid = 0; // เคลียร์ยอดเงินประมูลสูงสุด
        } else  { // winner
            require(STATE != AuctionState.STARTED, "the auction is still going"); // ต้องไม่อยู่ในสถานะการประมูล
            amount = bids[msg.sender]; // ยอดเงินที่ประมูลไป
            delete bids[msg.sender]; // ป้องกันการถูกโจมตีแบบ | เคลียร์เงินเรียบร้อยแล้ว
        }
        payable(msg.sender).transfer(amount); // โอนเงินคืนให้ผู้ประมูล
        emit WithdrawnEvent(msg.sender, amount, block.timestamp); //  บันทึก event ลง contract เมื่อเงินถูกถอนแล้ว
    }  
}